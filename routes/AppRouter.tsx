import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { LandingPage } from '../pages/LandingPage';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../i18n';
import { useIsPWA } from '../hooks/useIsPWA';
import { trackingService } from '../services/trackingService';

const AppMain = lazy(() => import('../pages/AppMain').then(module => ({ default: module.AppMain })));
const BlogPage = lazy(() => import('../components/BlogPage').then(module => ({ default: module.BlogPage })));
const BlogPostPage = lazy(() => import('../components/BlogPostPage').then(module => ({ default: module.BlogPostPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('../pages/TermsPage').then(module => ({ default: module.TermsPage })));

const PWARedirect = () => {
  const isPWA = useIsPWA();
  const navigate = useNavigate();

  useEffect(() => {
    if (isPWA && window.location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [isPWA, navigate]);

  return null;
};

export const AppRouter = () => {
  useEffect(() => {
    trackingService.initialize();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <>
                <PWARedirect />
                <LandingPage />
              </>
            } />
            
            <Route path="/blog" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-nature-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando blog...</p>
                  </div>
                </div>
              }>
                <BlogPage />
              </Suspense>
            } />
            
            <Route path="/blog/:slug" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-nature-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando post...</p>
                  </div>
                </div>
              }>
                <BlogPostPage />
              </Suspense>
            } />
            
            <Route path="/app/*" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-nature-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando app...</p>
                  </div>
                </div>
              }>
                <AppMain />
              </Suspense>
            } />
            
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route path="/privacy" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-nature-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                  </div>
                </div>
              }>
                <PrivacyPage />
              </Suspense>
            } />
            
            <Route path="/terms" element={
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-nature-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                  </div>
                </div>
              }>
                <TermsPage />
              </Suspense>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const { supabase, isSupabaseConfigured } = await import('../services/supabase');
        
        if (!isSupabaseConfigured) {
          setStatus('error');
          setMessage('Supabase não configurado');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Erro na autenticação');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus('error');
            setMessage('Erro ao processar autenticação');
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          if (data.session) {
            if (type === 'recovery') {
              window.history.replaceState(null, '', window.location.pathname);
              navigate('/app?action=reset-password', { replace: true });
              return;
            }
            
            setStatus('success');
            setMessage('Autenticação bem-sucedida!');
            setTimeout(() => {
              window.location.href = '/app';
            }, 500);
            return;
          }
        }

        const code = searchParams.get('code');
        if (code) {
          // Primeiro verifica se já existe uma sessão válida
          // (Supabase pode ter processado automaticamente via onAuthStateChange)
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          
          if (existingSession) {
            console.log('✅ Sessão já existe, redirecionando...');
            setStatus('success');
            setMessage('Autenticação bem-sucedida!');
            // Limpa a URL
            window.history.replaceState(null, '', '/auth/callback');
            setTimeout(() => {
              window.location.href = '/app';
            }, 500);
            return;
          }

          // Se não há sessão, tenta trocar o código
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              // Se o erro é de PKCE (código já usado ou code verifier ausente),
              // assume que a sessão foi criada pelo onAuthStateChange
              if (error.message?.includes('code verifier') || 
                  error.message?.includes('invalid request') ||
                  error.status === 400) {
                console.warn('⚠️ Erro de PKCE (código pode ter sido processado). Verificando sessão...');
                
                // Aguarda um pouco e verifica se a sessão foi criada pelo listener
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                
                if (retrySession) {
                  console.log('✅ Sessão encontrada após retry, redirecionando...');
                  setStatus('success');
                  setMessage('Autenticação bem-sucedida!');
                  window.history.replaceState(null, '', '/auth/callback');
                  setTimeout(() => {
                    window.location.href = '/app';
                  }, 500);
                  return;
                }
              }
              
              // Para outros erros, propaga
              throw error;
            }
            
            if (data.session) {
              setStatus('success');
              setMessage('Autenticação bem-sucedida!');
              window.history.replaceState(null, '', '/auth/callback');
              setTimeout(() => {
                window.location.href = '/app';
              }, 500);
              return;
            }
          } catch (err: any) {
            // Log do erro mas não bloqueia o fluxo se já houver sessão
            console.warn('⚠️ Erro ao trocar code (pode ser normal se já processado):', err?.message || err);
            
            // Verifica novamente se há sessão
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            if (finalSession) {
              console.log('✅ Sessão encontrada após erro, redirecionando...');
              setStatus('success');
              setMessage('Autenticação bem-sucedida!');
              window.history.replaceState(null, '', '/auth/callback');
              setTimeout(() => {
                window.location.href = '/app';
              }, 500);
              return;
            }
          }
        }

        // Timeout de segurança
        setTimeout(() => {
          if (!mounted) return;
          if (code) {
            setStatus('success');
            setMessage('Redirecionando...');
            window.location.href = '/app';
          } else {
            setStatus('error');
            setMessage('Tempo de autenticação expirado');
            setTimeout(() => navigate('/'), 3000);
          }
        }, 3000);

      } catch (error: any) {
        console.error('Erro no callback:', error);
        setStatus('error');
        setMessage('Erro ao processar autenticação');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nature-50">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-nature-600 text-white rounded-lg hover:bg-nature-700"
            >
              Voltar ao Início
            </button>
          </>
        )}
      </div>
    </div>
  );
};
