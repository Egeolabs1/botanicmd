import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { LandingPage } from '../pages/LandingPage';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../i18n';
import { useIsPWA } from '../hooks/useIsPWA';

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
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

// Componente para callback do OAuth do Supabase
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há parâmetro redirect na URL
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get('redirect') || '/app';
    
    // O Supabase já processa o callback automaticamente via onAuthStateChange
    // Aguarda um pouco para garantir que a autenticação foi processada
    const timer = setTimeout(() => {
      navigate(redirectTo, { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-nature-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
};

