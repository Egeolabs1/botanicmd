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
    const handleCallback = async () => {
      try {
        // Importa dinamicamente o supabase para não quebrar se não estiver configurado
        const { supabase, isSupabaseConfigured } = await import('../services/supabase');
        
        if (!isSupabaseConfigured) {
          setStatus('error');
          setMessage('Supabase não configurado. Redirecionando...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Processa os parâmetros da URL (tanto query params quanto hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Verifica se há erros na URL
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (error) {
          console.error('Erro na autenticação:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Erro na autenticação. Redirecionando...');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Verifica se há tokens no hash (OAuth/Magic Link/Confirmação de Email)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type'); // 'signup', 'recovery', etc.
        
        if (accessToken && refreshToken) {
          try {
            // Define a sessão com os tokens recebidos
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Erro ao definir sessão:', sessionError);
              setStatus('error');
              setMessage('Erro ao processar autenticação. Redirecionando...');
              setTimeout(() => navigate('/'), 3000);
              return;
            }

            if (data.session) {
              // Verifica se é recuperação de senha - redireciona para página de redefinição
              if (type === 'recovery') {
                // Limpa o hash da URL para não expor tokens
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                // Redireciona para o app que vai mostrar o modal de redefinição de senha
                navigate('/app?action=reset-password', { replace: true });
                return;
              }
              
              // Verifica se é confirmação de email
              if (type === 'signup' || type === 'email') {
                setStatus('success');
                setMessage('Email confirmado com sucesso! Redirecionando...');
              } else {
                setStatus('success');
                setMessage('Autenticação bem-sucedida! Redirecionando...');
              }
              
              // Verifica parâmetro de redirecionamento
              const redirectTo = hashParams.get('redirect') || searchParams.get('redirect') || '/app';
              
              // Limpa o hash da URL para não expor tokens
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
              
              // Aguarda um pouco para garantir que o estado foi atualizado
              setTimeout(() => {
                navigate(redirectTo, { replace: true });
              }, 1500);
              return;
            }
          } catch (sessionError: any) {
            console.error('Erro ao processar sessão:', sessionError);
            setStatus('error');
            setMessage('Erro ao processar autenticação. Redirecionando...');
            setTimeout(() => navigate('/'), 3000);
            return;
          }
        }

        // Se não há tokens, verifica se já existe uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('Autenticação confirmada! Redirecionando...');
          
          const redirectTo = searchParams.get('redirect') || '/app';
          setTimeout(() => {
            navigate(redirectTo, { replace: true });
          }, 1000);
          return;
        }

        // Se chegou aqui, não há sessão e não há tokens - pode ser confirmação de email
        // Aguarda um pouco para o Supabase processar via onAuthStateChange
        setMessage('Processando confirmação de email...');
        
        const redirectTo = searchParams.get('redirect') || '/app';
        
        // Aguarda até 3 segundos para a sessão ser estabelecida
        const checkInterval = setInterval(async () => {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            clearInterval(checkInterval);
            setStatus('success');
            setMessage('Email confirmado! Redirecionando...');
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 1000);
          }
        }, 500);

        // Timeout de segurança - redireciona mesmo se não conseguir confirmar
        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          setStatus('success');
          setMessage('Redirecionando...');
          navigate(redirectTo, { replace: true });
        }, 5000);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeout);
        };

      } catch (error: any) {
        console.error('Erro no callback de autenticação:', error);
        setStatus('error');
        setMessage('Erro ao processar autenticação. Redirecionando...');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nature-50">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
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
            <p className="text-red-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
};

