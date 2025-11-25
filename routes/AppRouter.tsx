import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { LandingPage } from '../pages/LandingPage';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../i18n';
import { useIsPWA } from '../hooks/useIsPWA';
import { trackingService } from '../services/trackingService';

// Lazy loading para componentes grandes e reduzir bundle inicial
const AppMain = lazy(() => import('../pages/AppMain').then(module => ({ default: module.AppMain })));
const BlogPage = lazy(() => import('../components/BlogPage').then(module => ({ default: module.BlogPage })));
const PrivacyPage = lazy(() => import('../pages/PrivacyPage').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('../pages/TermsPage').then(module => ({ default: module.TermsPage })));

// Componente que redireciona PWA instalado para /app
const PWARedirect = () => {
  const isPWA = useIsPWA();
  const navigate = useNavigate();

  useEffect(() => {
    // Se estiver em modo PWA (instalado), redireciona para /app
    if (isPWA && window.location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [isPWA, navigate]);

  return null;
};

export const AppRouter = () => {
  // Initialize tracking scripts on app load
  useEffect(() => {
    trackingService.initialize();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page - Apenas para web (não PWA) */}
            <Route path="/" element={
              <>
                <PWARedirect />
                <LandingPage />
              </>
            } />
            
            {/* Blog - Público */}
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
            
            {/* App Principal - Para PWA instalado ou após login */}
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
            
            {/* Callback do OAuth */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Legal Pages */}
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
            
            {/* Redirect padrão */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

// Componente para callback do OAuth e confirmação de email do Supabase
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Autenticando...');

  useEffect(() => {
    let mounted = true;
    let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    let checkInterval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    const handleCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Iniciando processamento...', {
          hash: window.location.hash.substring(0, 50),
          search: window.location.search,
          hostname: window.location.hostname
        });

        // Importa dinamicamente o supabase para não quebrar se não estiver configurado
        const { supabase, isSupabaseConfigured } = await import('../services/supabase');
        
        // Se estiver em vercel.app E tiver código de autorização, redireciona para botanicmd.com
        if (window.location.hostname === 'botanicmd.vercel.app') {
          const hasCode = window.location.search.includes('code=') || window.location.hash.includes('access_token');
          if (hasCode) {
            const currentUrl = window.location.href;
            const newUrl = currentUrl.replace('botanicmd.vercel.app', 'botanicmd.com');
            console.log('🔄 AuthCallback: Redirecionando para botanicmd.com');
            window.location.replace(newUrl);
            return;
          }
        }
        
        if (!isSupabaseConfigured) {
          setStatus('error');
          setMessage('Supabase não configurado. Redirecionando...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Processa os parâmetros da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('📋 AuthCallback: Parâmetros da URL:', {
          hash: window.location.hash.substring(0, 100),
          search: window.location.search,
          code: searchParams.get('code'),
          redirect: searchParams.get('redirect')
        });
        
        // Verifica se há erros na URL
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (error) {
          console.error('❌ AuthCallback: Erro na autenticação:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Erro na autenticação. Redirecionando...');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Função auxiliar para redirecionar
        const redirectToApp = (redirectPath = '/app') => {
          if (!mounted) return;
          
          let redirectTo = hashParams.get('redirect') || searchParams.get('redirect') || redirectPath;
          
          if (redirectTo.includes('vercel.app')) {
            redirectTo = '/app';
          }
          
          // Decodifica URL se necessário
          try {
            redirectTo = decodeURIComponent(redirectTo);
          } catch (e) {
            // Ignora erro de decodificação
          }
          
          if (window.location.hostname === 'botanicmd.vercel.app') {
            window.location.href = `https://botanicmd.com${redirectTo}`;
            return;
          }
          
          setStatus('success');
          setMessage('Autenticação bem-sucedida! Redirecionando...');
          
          // Para Edge: usa window.location.href diretamente (mais confiável que navigate)
          // Edge pode ter problemas com React Router navigate() após autenticação
          console.log('🚀 AuthCallback: Redirecionando para', redirectTo);
          
          // Limpa a URL completamente
          window.history.replaceState(null, '', redirectTo);
          
          // No Edge, window.location.href é mais confiável que navigate()
          // Aguarda um pouco para garantir que a sessão foi salva
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 200);
        };

        // Verifica se há tokens no hash (OAuth PKCE flow)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken && refreshToken) {
          console.log('✅ AuthCallback: Tokens encontrados no hash, definindo sessão...');
          try {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('❌ AuthCallback: Erro ao definir sessão:', sessionError);
              setStatus('error');
              setMessage('Erro ao processar autenticação. Redirecionando...');
              setTimeout(() => navigate('/'), 3000);
              return;
            }

            if (data.session) {
              console.log('✅ AuthCallback: Sessão definida com sucesso!', data.session.user.email);
              
              if (type === 'recovery') {
                window.history.replaceState(null, '', window.location.pathname);
                navigate('/app?action=reset-password', { replace: true });
                return;
              }
              
              redirectToApp();
              return;
            }
          } catch (sessionError: any) {
            console.error('❌ AuthCallback: Erro ao processar sessão:', sessionError);
            setStatus('error');
            setMessage('Erro ao processar autenticação. Redirecionando...');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
        }

        // O Supabase com PKCE precisa trocar o code por tokens
        const code = searchParams.get('code');
        console.log('📋 AuthCallback: Code presente na URL?', code ? `Sim (${code.substring(0, 20)}...)` : 'Não');
        
        let sessionFound = false;
        
        // PRIMEIRO: Configura o listener ANTES de qualquer coisa
        console.log('👂 AuthCallback: Configurando listener...');
        
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔔 AuthCallback: Auth state changed:', event, session?.user?.email || 'no user');
          
          if (!mounted || sessionFound) return;

          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            console.log('✅ AuthCallback: Usuário autenticado via onAuthStateChange! Redirecionando...', session.user.email);
            sessionFound = true;
            
            // Limpa tudo
            if (checkInterval) clearInterval(checkInterval);
            if (timeout) clearTimeout(timeout);
            if (authSubscription?.data?.subscription) authSubscription.data.subscription.unsubscribe();
            
            redirectToApp();
          }
        });
        
        console.log('👂 AuthCallback: Listener configurado');
        
        // SEGUNDO: Se há um code, tenta trocar manualmente (Edge pode precisar disso)
        if (code) {
          console.log('🔄 AuthCallback: Tentando trocar code por sessão manualmente...');
          
          try {
            // Tenta exchangeCodeForSession com timeout
            const exchangePromise = supabase.auth.exchangeCodeForSession(code);
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );
            
            const { data, error } = await Promise.race([exchangePromise, timeoutPromise]) as any;
            
            if (error) {
              console.warn('⚠️ AuthCallback: Erro ao trocar code:', error);
            } else if (data?.session?.user) {
              console.log('✅ AuthCallback: Sessão obtida via exchangeCodeForSession!', data.session.user.email);
              sessionFound = true;
              
              // Limpa tudo
              if (checkInterval) clearInterval(checkInterval);
              if (timeout) clearTimeout(timeout);
              if (authSubscription?.data?.subscription) authSubscription.data.subscription.unsubscribe();
              
              redirectToApp();
              return;
            }
          } catch (err: any) {
            console.warn('⚠️ AuthCallback: exchangeCodeForSession falhou/timeout:', err?.message || err);
            // Continua para o fallback
          }
        }
        
        // Se chegou aqui, o exchangeCodeForSession não funcionou
        // Aguarda o onAuthStateChange ou o timeout de segurança
        console.log('⏳ AuthCallback: Aguardando onAuthStateChange ou timeout de segurança...');
        setMessage('Processando autenticação... Aguarde.');
        
        // Não faz mais polling com getSession() já que está travando no Edge
        // Confia no onAuthStateChange e no timeout de segurança
        
        // Timeout de segurança - redireciona após 5 segundos de qualquer forma
        // No Edge, o onAuthStateChange pode não disparar, então forçamos o redirecionamento
        timeout = setTimeout(() => {
          if (!mounted || sessionFound) return;
          
          console.warn('⏱️ AuthCallback: Timeout após 5s - forçando redirecionamento para /app...');
          
          if (authSubscription?.data?.subscription) {
            authSubscription.data.subscription.unsubscribe();
            authSubscription = null;
          }
          
          // No Edge, o getSession() trava, então não vamos tentar verificar
          // O AuthContext vai verificar a sessão quando o /app carregar
          // Se há um code na URL, provavelmente a autenticação funcionou
          if (code) {
            console.log('🔄 AuthCallback: Code estava presente, redirecionando para /app...');
            setStatus('success');
            setMessage('Redirecionando...');
            // Força redirecionamento usando window.location (mais confiável no Edge)
            window.location.href = '/app';
          } else {
            setStatus('error');
            setMessage('Tempo de autenticação expirado. Tente fazer login novamente.');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          }
        }, 5000); // 5 segundos - reduzido para melhor UX

      } catch (error: any) {
        console.error('❌ AuthCallback: Erro geral:', error);
        setStatus('error');
        setMessage('Erro ao processar autenticação. Redirecionando...');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();

    // Cleanup
    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
        authSubscription = null;
      }
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nature-50">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg mb-2">{message}</p>
            <p className="text-xs text-gray-400 mb-6">v2.1 - Aguardando confirmação...</p>
            
            {/* Botão de emergência se travar */}
            <button 
              onClick={() => window.location.href = 'https://botanicmd.com/app'}
              className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Demorando muito? Clique aqui para entrar
            </button>
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
            <p className="text-xs text-gray-400 mt-2">Redirecionando...</p>
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

