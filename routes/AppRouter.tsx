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
        // Se houver um code na URL, o Supabase deve processá-lo automaticamente
        // Mas no Edge, pode precisar de mais tempo
        
        const code = searchParams.get('code');
        console.log('📋 AuthCallback: Code presente na URL?', code ? `Sim (${code.substring(0, 20)}...)` : 'Não');
        
        if (code) {
          console.log('🔄 AuthCallback: Supabase deve processar o code automaticamente via PKCE');
        }
        
        // O Supabase com PKCE processa o code automaticamente
        // PRIMEIRO: Configura o listener ANTES de verificar para não perder eventos
        console.log('👂 AuthCallback: Configurando listener PRIMEIRO...');
        let sessionFound = false;
        
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔔 AuthCallback: Auth state changed:', event, session?.user?.email || 'no user');
          
          if (!mounted || sessionFound) return;

          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
            console.log('✅ AuthCallback: Usuário autenticado via onAuthStateChange! Redirecionando...', session.user.email);
            sessionFound = true;
            
            // Limpa tudo
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
            
            // Redireciona IMEDIATAMENTE
            redirectToApp();
          }
        });
        
        // SEGUNDO: Aguarda um pouco para o Supabase processar o code (Edge precisa de mais tempo)
        console.log('🔍 AuthCallback: Aguardando 800ms antes de verificar sessão (Edge compatibility)...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('🔍 AuthCallback: Verificando sessão após delay...');
        
        // Verifica se há um código na URL (Supabase PKCE precisa processar isso)
        const code = searchParams.get('code');
        console.log('📋 AuthCallback: Code na URL?', code ? 'Sim' : 'Não', code ? `(${code.substring(0, 20)}...)` : '');
        
        console.log('🔄 AuthCallback: Iniciando loop de verificação de sessão (8 tentativas)...');
        
        // Verifica várias vezes rapidamente (o Supabase pode estar processando)
        for (let i = 0; i < 8; i++) {
          console.log(`🔍 AuthCallback: Iniciando verificação ${i + 1}/8...`);
          try {
            console.log(`🔍 AuthCallback: Verificando sessão (tentativa ${i + 1}/8)...`);
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.warn(`⚠️ AuthCallback: Erro ao verificar sessão (verificação ${i + 1}):`, sessionError);
            }
            
            if (session?.user) {
              console.log(`✅ AuthCallback: Sessão encontrada! (verificação ${i + 1}) Redirecionando...`, session.user.email);
              sessionFound = true;
              
              // Limpa listener
              if (authSubscription?.data?.subscription) {
                authSubscription.data.subscription.unsubscribe();
                authSubscription = null;
              }
              
              redirectToApp();
              return;
            } else {
              console.log(`⏳ AuthCallback: Sessão não encontrada ainda (verificação ${i + 1}/8). Aguardando...`);
            }
          } catch (err) {
            console.error(`❌ AuthCallback: Erro na verificação ${i + 1}:`, err);
          }
          
          if (i < 7) {
            // Aguarda mais tempo entre verificações no Edge
            console.log(`⏳ AuthCallback: Aguardando 400ms antes da próxima verificação...`);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
        
        console.log('⏳ AuthCallback: Sessão não encontrada nas verificações iniciais, iniciando polling...');
        
        // TERCEIRO: Se ainda não encontrou, aguarda polling ou timeout
        console.log('⏳ AuthCallback: Aguardando sessão ser criada...');
        setMessage('Processando autenticação com Google...');
        
        // Polling para detectar sessão rapidamente
        let pollAttempts = 0;
        const maxPollAttempts = 30; // 15 segundos total (500ms * 30)
        
        checkInterval = setInterval(async () => {
          if (!mounted || sessionFound) return;
          
          pollAttempts++;
          
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error && pollAttempts % 5 === 0) {
            console.warn(`⚠️ AuthCallback: Erro no poll (tentativa ${pollAttempts}):`, error);
          }
          
          if (currentSession?.user) {
            console.log(`✅ AuthCallback: Sessão encontrada no poll! (tentativa ${pollAttempts})`, currentSession.user.email);
            sessionFound = true;
            
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
            
            redirectToApp();
          } else if (pollAttempts >= maxPollAttempts) {
            console.warn('⚠️ AuthCallback: Máximo de tentativas atingido, parando poll');
            if (checkInterval) {
              clearInterval(checkInterval);
              checkInterval = null;
            }
          }
        }, 500);

        // Timeout de segurança - redireciona após 10 segundos
        timeout = setTimeout(() => {
          if (!mounted) return;
          
          console.warn('⏱️ AuthCallback: Timeout após 10s - verificando sessão uma última vez...');
          
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
          if (authSubscription?.data?.subscription) {
            authSubscription.data.subscription.unsubscribe();
            authSubscription = null;
          }
          
          // Verifica uma última vez
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (!mounted) return;
            
            if (session?.user) {
              console.log('✅ AuthCallback: Sessão encontrada no timeout!', session.user.email);
              redirectToApp();
            } else {
              console.error('❌ AuthCallback: Nenhuma sessão encontrada após timeout', error);
              
              // Tenta redirecionar de qualquer forma se há um code (Supabase pode ter processado)
              const code = searchParams.get('code');
              if (code) {
                console.log('🔄 AuthCallback: Code presente, redirecionando para /app...');
                setStatus('success');
                setMessage('Redirecionando...');
                window.history.replaceState(null, '', '/app');
                navigate('/app', { replace: true });
              } else {
                setStatus('error');
                setMessage('Tempo de autenticação expirado. Tente fazer login novamente.');
                setTimeout(() => navigate('/'), 3000);
              }
            }
          });
        }, 10000); // 10 segundos

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

