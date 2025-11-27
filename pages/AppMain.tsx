import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadSection } from '../components/UploadSection';
import { ResultCard } from '../components/ResultCard';
import { GardenGallery } from '../components/GardenGallery';
import { PlantSelector } from '../components/PlantSelector';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { AuthModal } from '../components/AuthModal';
import { PricingModal } from '../components/PricingModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UserProfile } from '../components/UserProfile';
import { AboutModal } from '../components/AboutModal';
import { Luxometer } from '../components/Luxometer';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

// Lazy load para componentes grandes (reduz bundle inicial)
const AdminDashboard = lazy(() => import('../components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const BlogPage = lazy(() => import('../components/BlogPage').then(module => ({ default: module.BlogPage })));
import { analyzePlantImage, identifyPlantByName, searchPlantOptions } from '../services/geminiService';
import { fetchPlantImage } from '../services/imageService';
import { PlantData, AppState, PlantCandidate } from '../types';
import { Leaf, BookHeart, Star, Sun, BookOpen } from '../components/Icons';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { storage, SavedPlant } from '../services/storageService';
import { historyService } from '../services/historyService';
import { isAdmin } from '../services/adminAuthService';
import { SEOHead, getWebApplicationSchema, getSoftwareApplicationSchema, breadcrumbSchema } from '../components/SEOHead';

const PLACEHOLDER_PLANT_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23dcfce7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%2386efac;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad)' /%3E%3Cpath d='M200 100c0 0 40 60 40 100s-20 60-40 80c-20-20-40-40-40-80s40-100 40-100z' fill='%2315803d' opacity='0.6'/%3E%3Cpath d='M200 280v60' stroke='%2315803d' stroke-width='8' stroke-linecap='round' /%3E%3Ccircle cx='200' cy='200' r='140' stroke='%23fff' stroke-width='4' fill='none' opacity='0.5' /%3E%3C/svg%3E`;

export const AppMain: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, logout, incrementUsage, checkLimit, upgradeToPro, refreshUserPlan, isLoading: isAuthLoading } = useAuth();
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [plantData, setPlantData] = useState<PlantData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [candidates, setCandidates] = useState<PlantCandidate[]>([]);
  
  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isLuxometerOpen, setIsLuxometerOpen] = useState(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState(false);
  
  // Loading Scan Effect
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);

  useEffect(() => {
    // Não redireciona durante o carregamento inicial
    if (isAuthLoading) {
      console.log('⏳ AppMain: Aguardando autenticação carregar...');
      return;
    }

    // Aguarda 5 segundos após carregar para dar tempo do auth atualizar
    // (especialmente após login recente onde mapUser pode demorar)
    const timer = setTimeout(() => {
      if (!isAuthenticated && window.location.pathname === '/app') {
        console.log('❌ AppMain: Usuário não autenticado após timeout, redirecionando para /');
        navigate('/');
      } else if (isAuthenticated) {
        console.log('✅ AppMain: Usuário autenticado, página deve estar visível');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAuthLoading, navigate]);

  useEffect(() => {
    const loadPlants = async () => {
      const plants = await storage.getPlants();
      setSavedPlants(plants);
    };
    loadPlants();
  }, []);

  // Handle Payment Success Callback
  useEffect(() => {
    // Espera o usuário estar carregado antes de processar o pagamento
    if (isAuthLoading) return;
    
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const sessionId = params.get('session_id');
    const simulated = params.get('simulated');
    
    if (status === 'success') {
      const handlePaymentSuccess = async () => {
        // Se o usuário não estiver carregado, tenta novamente após um delay
        if (!user || !isAuthenticated) {
          const retryTimer = setTimeout(() => {
            if (user && isAuthenticated) {
              handlePaymentSuccess();
            }
          }, 1000);
          return () => clearTimeout(retryTimer);
        }
        
        if (simulated && process.env.NODE_ENV === 'development') {
          // Modo de simulação (apenas desenvolvimento)
          upgradeToPro();
          alert("✨ Simulação de pagamento bem-sucedida! Você agora é PRO! 🌟");
        } else if (sessionId) {
          // Verifica o status real da sessão de checkout
          console.log('💳 Processando pagamento com session_id:', sessionId);
          try {
            const { verifyCheckoutSession, syncUserPlan } = await import('../services/subscriptionService');
            
            // Primeira tentativa - aguarda o webhook processar
            let isValid = await verifyCheckoutSession(sessionId);
            
            if (isValid) {
              const newPlan = await syncUserPlan();
              if (newPlan === 'pro') {
                // Atualiza imediatamente o estado local
                upgradeToPro();
                // Recarrega o plano do banco para garantir sincronização completa
                setTimeout(() => {
                  refreshUserPlan();
                }, 1000);
                alert('✅ Pagamento confirmado! Você agora é PRO! 🌟');
                console.log('✅ Pagamento confirmado! Seu plano foi atualizado.');
              } else {
                console.warn('⚠️ Plano não sincronizado corretamente:', newPlan);
              }
            } else {
              // Segunda tentativa após mais tempo (webhook pode demorar)
              console.log('⏳ Webhook pode estar processando, aguardando mais 5 segundos...');
              setTimeout(async () => {
                const retryIsValid = await verifyCheckoutSession(sessionId);
                if (retryIsValid) {
                  const retryPlan = await syncUserPlan();
                  if (retryPlan === 'pro') {
                    upgradeToPro();
                    setTimeout(() => {
                      refreshUserPlan();
                    }, 1000);
                    alert('✅ Pagamento confirmado! Você agora é PRO! 🌟');
                    console.log('✅ Pagamento confirmado após retry! Seu plano foi atualizado.');
                  }
                } else {
                  // Terceira tentativa - força verificação
                  console.log('⏳ Última tentativa de verificação...');
                  setTimeout(async () => {
                    const finalPlan = await syncUserPlan();
                    if (finalPlan === 'pro') {
                      upgradeToPro();
                      setTimeout(() => {
                        refreshUserPlan();
                      }, 1000);
                      alert('✅ Pagamento confirmado! Você agora é PRO! 🌟');
                    } else {
                      console.error('❌ Não foi possível verificar o pagamento. Verifique no Stripe Dashboard se o pagamento foi processado.');
                      alert('⚠️ Pagamento recebido, mas a verificação está demorando. Recarregue a página em alguns instantes ou entre em contato com o suporte.');
                    }
                  }, 5000);
                }
              }, 5000);
            }
          } catch (error) {
            console.error('❌ Erro ao verificar sessão de checkout:', error);
            // Tenta sincronizar o plano mesmo assim
            try {
              const { syncUserPlan } = await import('../services/subscriptionService');
              const plan = await syncUserPlan();
              if (plan === 'pro') {
                upgradeToPro();
                alert('✅ Seu plano foi atualizado!');
              }
            } catch (syncError) {
              console.error('❌ Erro ao sincronizar plano:', syncError);
              alert('⚠️ Erro ao verificar pagamento. Se o pagamento foi processado, recarregue a página ou entre em contato com o suporte.');
            }
          }
        } else {
          // Fallback: tenta sincronizar o plano mesmo sem session_id
          console.log('⚠️ Sem session_id, tentando sincronizar plano...');
          try {
            const { syncUserPlan } = await import('../services/subscriptionService');
            const plan = await syncUserPlan();
            if (plan === 'pro') {
              upgradeToPro();
              alert('✅ Seu plano foi atualizado!');
            }
          } catch (error) {
            console.error('❌ Erro ao sincronizar plano:', error);
          }
        }
        
        // Limpa a URL para não reprocessar ao atualizar
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      
      handlePaymentSuccess();
    } else if (status === 'cancelled') {
      // Limpa a URL se o pagamento foi cancelado
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [upgradeToPro, user, isAuthenticated, isAuthLoading]);

  // Handle Password Reset Callback
  useEffect(() => {
    if (isAuthLoading) return;
    
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'reset-password' && isAuthenticated && user) {
      // Limpa a URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Abre o modal de redefinição de senha
      setIsResetPasswordModalOpen(true);
    }
  }, [isAuthLoading, isAuthenticated, user]);

  // Cycle tips during analysis
  useEffect(() => {
    let interval: any;
    if (appState === AppState.ANALYZING) {
      interval = setInterval(() => {
        setLoadingTipIndex(prev => (prev + 1) % 3);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const checkAccess = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return false;
    }
    if (!checkLimit()) {
      setIsPricingModalOpen(true);
      return false;
    }
    return true;
  };

  const getErrorMessage = (err: any) => {
    const msg = err?.message?.toLowerCase() || '';
    
    // Verifica se é erro de API não configurada
    if (msg.includes('gemini api não está configurada') || msg.includes('gemini_api_key') || msg.includes('configure a variável')) {
      return language === 'pt' 
        ? '⚠️ API Gemini não configurada. Para usar as funcionalidades de IA, configure a variável VITE_GEMINI_API_KEY no Vercel Dashboard (Settings → Environment Variables).'
        : '⚠️ Gemini API not configured. To use AI features, configure VITE_GEMINI_API_KEY in Vercel Dashboard (Settings → Environment Variables).';
    }
    
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) return t('err_network');
    if (msg.includes('analyze') || msg.includes('model') || msg.includes('photo') || msg.includes('image')) return t('err_image_analyze');
    if (msg.includes('find') || msg.includes('found')) return t('err_plant_not_found');
    return t('err_unexpected');
  };

  const handleImageSelected = async (file: File) => {
    if (!checkAccess()) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const data = await analyzePlantImage(base64Data, file.type, language);
          setPlantData(data);
          incrementUsage();
          // Salvar no histórico
          historyService.addEntry({
            plantName: data.commonName,
            scientificName: data.scientificName,
            type: 'image',
            result: 'success',
          });
          setAppState(AppState.SUCCESS);
        } catch (err) {
          console.error(err);
          setError(getErrorMessage(err));
          setAppState(AppState.ERROR);
        }
      };
      reader.onerror = () => {
        setError(t('err_image_process'));
        setAppState(AppState.ERROR);
      };
    } catch (err) {
      setError(t('err_image_process'));
      setAppState(AppState.ERROR);
    }
  };

  const handleTextSearch = async (text: string) => {
    if (!checkAccess()) return;
    
    setAppState(AppState.ANALYZING);
    setImagePreview(PLACEHOLDER_PLANT_IMAGE);
    setError(null);
    
    try {
      const options = await searchPlantOptions(text, language);
      
      if (options.length === 0) {
         const data = await identifyPlantByName(text, language);
         setPlantData(data);
         
         const realImageUrl = await fetchPlantImage(data.scientificName) || await fetchPlantImage(data.commonName);
         if (realImageUrl) {
            setImagePreview(realImageUrl);
            setPlantData(prev => prev ? {...prev, imageUrl: realImageUrl} : null);
         } else {
            setImagePreview(PLACEHOLDER_PLANT_IMAGE);
         }

         incrementUsage();
         // Salvar no histórico
         historyService.addEntry({
           plantName: data.commonName,
           scientificName: data.scientificName,
           type: 'text',
           result: 'success',
         });
         setAppState(AppState.SUCCESS);
      } else if (options.length === 1) {
         await handleCandidateSelect(options[0]);
      } else {
         const candidatesWithImages = await Promise.all(options.map(async (opt) => {
            const img = await fetchPlantImage(opt.scientificName) || await fetchPlantImage(opt.commonName);
            return { ...opt, imageUrl: img || undefined };
         }));
         
         setCandidates(candidatesWithImages);
         setAppState(AppState.SELECTING);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
      setAppState(AppState.ERROR);
    }
  };

  const handleCandidateSelect = async (candidate: PlantCandidate) => {
    if (!checkAccess()) return;

    setAppState(AppState.ANALYZING);
    if (candidate.imageUrl) {
      setImagePreview(candidate.imageUrl);
    } else {
      setImagePreview(PLACEHOLDER_PLANT_IMAGE);
    }

    try {
      const data = await identifyPlantByName(candidate.commonName, language);
      
      let finalImage = candidate.imageUrl;
      if (!finalImage) {
         finalImage = await fetchPlantImage(data.scientificName) || null;
      }

      const finalData = { ...data, imageUrl: finalImage || undefined };
      setPlantData(finalData);
      
      if (finalImage) {
        setImagePreview(finalImage);
      }

      incrementUsage();
      // Salvar no histórico
      historyService.addEntry({
        plantName: finalData.commonName,
        scientificName: finalData.scientificName,
        type: 'text',
        result: 'success',
      });
      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
      setAppState(AppState.ERROR);
    }
  };

  const savePlantToGarden = async () => {
    if (user?.plan !== 'pro') {
      setIsPricingModalOpen(true);
      return;
    }
    
    if (plantData && imagePreview) {
      try {
        const newPlantData = { ...plantData, id: crypto.randomUUID(), savedAt: Date.now(), language };
        const newSavedPlant = { data: newPlantData, image: imagePreview };
        
        // Atualiza estado local imediatamente para feedback visual
        setSavedPlants(prev => [newSavedPlant, ...prev]);
        
        // Salva no Supabase
        const updatedList = await storage.savePlant(newSavedPlant);
        setSavedPlants(updatedList);
        setPlantData(newPlantData);
        
        // Mostra modal de confirmação
        setIsSaveSuccessModalOpen(true);
      } catch (error) {
        console.error('Erro ao salvar planta:', error);
        alert('Erro ao salvar planta. Tente novamente.');
      }
    }
  };

  const deletePlantFromGarden = async (id: string) => {
    setSavedPlants(prev => prev.filter(p => p.data.id !== id));
    const updatedList = await storage.deletePlant(id);
    setSavedPlants(updatedList);
  };

  const openPlantDetails = (plant: SavedPlant) => {
    console.log('🌿 Abrindo detalhes da planta:', plant);
    console.log('📸 Imagem da planta:', plant.image);
    
    // Garante que a imagem existe ou usa placeholder
    const imageToShow = plant.image || PLACEHOLDER_PLANT_IMAGE;
    
    // Scroll para o topo ANTES de mudar o estado
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    setPlantData(plant.data);
    setImagePreview(imageToShow);
    setAppState(AppState.SUCCESS);
    
    // Garante scroll após renderização (fallback)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Também tenta scrollar o elemento main se existir
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setPlantData(null);
    setImagePreview(null);
    setError(null);
    setCandidates([]);
  };

  const goToGarden = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (user?.plan !== 'pro') {
      setIsPricingModalOpen(true);
      return;
    }
    setAppState(AppState.GARDEN);
    setError(null);
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    setPlantData(null);
    setImagePreview(null);
    setError(null);
    setSavedPlants([]); 
    setCandidates([]);
    navigate('/');
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const isCurrentPlantSaved = plantData?.id ? savedPlants.some(p => p.data.id === plantData.id) : false;


  const loadingTips = [
    t('preparing_info'),
    "Scanning leaf structure...",
    "Checking botanical database..."
  ];

  // Auto-scroll to top on success
  useEffect(() => {
    if (appState === AppState.SUCCESS || appState === AppState.BLOG) {
      window.scrollTo(0, 0);
    }
  }, [appState]);

  // Loading Screen while Auth initializes
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nature-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600"></div>
      </div>
    );
  }

  if (appState === AppState.ADMIN) {
    // Verificar se o usuário é admin antes de mostrar o painel
    if (!isAdmin(user)) {
      // Usuário não é admin - redirecionar e mostrar alerta
      alert('Acesso negado. Apenas administradores podem acessar este painel.');
      setAppState(AppState.IDLE);
      return (
        <div className="min-h-screen flex items-center justify-center bg-nature-50">
          <div className="text-center">
            <p className="text-gray-600">Redirecionando...</p>
          </div>
        </div>
      );
    }
    
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-nature-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nature-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando painel admin...</p>
          </div>
        </div>
      }>
        <AdminDashboard onExit={() => {
          setAppState(AppState.IDLE);
          navigate('/app', { replace: true });
        }} />
      </Suspense>
    );
  }

  // Gera keywords baseadas no idioma para o app
  const generateAppKeywords = (lang: string): string => {
    const keywords: { [key: string]: string } = {
      'pt': 'app identificar plantas, app plantas, identificação plantas app, diagnóstico plantas app, jardinagem app, IA plantas app',
      'en': 'plant identification app, plant app, plant ID app, plant diagnosis app, gardening app, AI plants app',
      'es': 'app identificar plantas, app plantas, identificación plantas app, diagnóstico plantas app, jardinería app, IA plantas app',
      'fr': 'app identification plantes, app plantes, identification plantes app, diagnostic plantes app, jardinage app, IA plantes app',
      'de': 'Pflanzen App, Pflanzen identifizieren App, Pflanzendiagnose App, Garten App, KI Pflanzen App',
      'it': 'app identificare piante, app piante, identificazione piante app, diagnosi piante app, giardinaggio app, IA piante app',
      'zh': '植物识别应用, 植物应用, 植物识别应用, 植物诊断应用, 园艺应用, AI植物应用',
      'ru': 'приложение идентификация растений, приложение растений, идентификация растений приложение, диагностика растений приложение, садоводство приложение, ИИ растения приложение',
      'hi': 'पौधे पहचान ऐप, पौधे ऐप, पौधे पहचान ऐप, पौधे निदान ऐप, बागवानी ऐप, AI पौधे ऐप'
    };
    return keywords[lang] || keywords['en'];
  };

  // Breadcrumbs para o app
  const breadcrumbs = breadcrumbSchema([
    { name: t('app_name'), url: 'https://botanicmd.com/' },
    { name: 'App', url: 'https://botanicmd.com/app' }
  ]);

  // Structured data para o app
  const appStructuredData = [
    getWebApplicationSchema(t, language),
    getSoftwareApplicationSchema(t, language),
    breadcrumbs
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans pb-20 md:pb-12 selection:bg-nature-200">
      <SEOHead 
        title={`${t('app_name')} - ${t('tagline')} | App`}
        description={`Use ${t('app_name')} para identificar plantas, diagnosticar doenças e cuidar do seu jardim com IA. ${t('hero_subtitle')}`}
        keywords={generateAppKeywords(language)}
        structuredData={appStructuredData}
        url="https://botanicmd.com/app"
      />
      <PWAInstallPrompt />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      <ResetPasswordModal isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} />
      <Luxometer isOpen={isLuxometerOpen} onClose={() => setIsLuxometerOpen(false)} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <SaveSuccessModal 
        isOpen={isSaveSuccessModalOpen} 
        onClose={() => setIsSaveSuccessModalOpen(false)}
        plantName={plantData?.commonName}
      />
      
      {user && isProfileOpen && (
        <UserProfile 
          user={user} 
          onClose={() => setIsProfileOpen(false)} 
          onLogout={handleLogout}
          onUpgrade={() => { setIsProfileOpen(false); setIsPricingModalOpen(true); }}
          onAdmin={() => setAppState(AppState.ADMIN)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
          onOpenPrivacy={() => {
            setIsProfileOpen(false);
            navigate('/privacy');
          }}
        />
      )}
      
      <header className="h-20 fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetApp}>
            <div className="bg-gradient-to-br from-nature-500 to-nature-600 p-2.5 rounded-xl text-white shadow-lg shadow-nature-500/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-nature-700 transition-colors hidden sm:block">
              {t('app_name')}
            </h1>
          </div>
          
          {/* Center: Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-full border border-gray-200/50 absolute left-1/2 transform -translate-x-1/2">
             <button
               onClick={resetApp}
               className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                 appState !== AppState.GARDEN && appState !== AppState.BLOG
                   ? 'bg-white text-nature-700 shadow-sm ring-1 ring-gray-200' 
                   : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
               }`}
             >
               <Leaf className={`w-4 h-4 ${appState !== AppState.GARDEN && appState !== AppState.BLOG ? 'fill-nature-100' : ''}`} />
               {t('identify')}
             </button>
             <button
               onClick={goToGarden}
               className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                 appState === AppState.GARDEN 
                   ? 'bg-white text-nature-700 shadow-sm ring-1 ring-gray-200' 
                   : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
               }`}
             >
               <BookHeart className={`w-4 h-4 ${appState === AppState.GARDEN ? 'fill-nature-100' : ''}`} />
               {t('my_garden')}
             </button>
              <button
               onClick={() => navigate('/blog', { state: { from: '/app' } })}
               className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                 appState === AppState.BLOG
                   ? 'bg-white text-nature-700 shadow-sm ring-1 ring-gray-200' 
                   : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
               }`}
             >
               <BookOpen className={`w-4 h-4 ${appState === AppState.BLOG ? 'fill-nature-100' : ''}`} />
               {t('nav_blog')}
             </button>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 md:gap-4">
             
             <button 
                onClick={() => setIsLuxometerOpen(true)}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors shadow-sm group"
                title={t('lux_title')}
             >
               <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
             </button>

             {/* Mobile Nav Items */}
             <div className="flex md:hidden items-center gap-1 mr-1">
                <button 
                  onClick={resetApp} 
                  className={`p-2.5 rounded-full transition-colors ${appState !== AppState.GARDEN && appState !== AppState.BLOG ? 'bg-nature-100 text-nature-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                   <Leaf className="w-5 h-5" />
                </button>
                <button 
                  onClick={goToGarden} 
                  className={`p-2.5 rounded-full transition-colors ${appState === AppState.GARDEN ? 'bg-nature-100 text-nature-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                   <BookHeart className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => navigate('/blog', { state: { from: '/app' } })}
                  className={`p-2.5 rounded-full transition-colors ${appState === AppState.BLOG ? 'bg-nature-100 text-nature-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                   <BookOpen className="w-5 h-5" />
                </button>
             </div>

             {isAuthenticated && user?.plan === 'free' && (
                <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-300 to-yellow-500 text-white rounded-full text-xs font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-105 transition-all"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>PRO</span>
                </button>
             )}

             {isAuthenticated && user ? (
                <button 
                  onClick={() => setIsProfileOpen(true)} 
                  className="relative group outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nature-100 to-nature-200 flex items-center justify-center text-nature-700 font-bold text-sm border-2 border-white shadow-md group-hover:ring-2 group-hover:ring-nature-300 group-hover:ring-offset-2 transition-all">
                     {getInitials(user.name)}
                  </div>
                  {user.plan === 'pro' && (
                     <div className="absolute -bottom-1 -right-1 bg-yellow-400 border-2 border-white rounded-full p-0.5">
                       <Star className="w-2.5 h-2.5 text-white fill-white" />
                     </div>
                  )}
                </button>
             ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)} 
                  className="text-gray-900 font-semibold hover:bg-gray-100 px-5 py-2.5 rounded-full transition-colors text-sm"
                >
                  Entrar
                </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-28 md:pt-32 print:pt-0 print:px-0">
        
        {appState === AppState.IDLE && (
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              {t('hero_title')} <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nature-600 to-teal-500">
                {t('hero_highlight')}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
              {t('hero_subtitle')}
            </p>
            
            <UploadSection 
              onImageSelected={handleImageSelected} 
              onTextSearch={handleTextSearch}
              onUpgrade={() => setIsPricingModalOpen(true)}
            />
          </div>
        )}

        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in relative min-h-[50vh]">
            
            {/* Scanner Visual */}
            <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-nature-200 mb-8 group">
              {/* Image or Placeholder */}
              <img 
                src={imagePreview || PLACEHOLDER_PLANT_IMAGE} 
                alt="Analyzing" 
                className="w-full h-full object-cover opacity-80 filter blur-[2px] transition-all duration-1000" 
              />
              
              {/* Grid Overlay with CSS Pattern to avoid CORS/Network errors */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>

              {/* Scanning Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-nature-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              
              {/* Corner Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-nature-500 rounded-tl-xl"></div>
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-nature-500 rounded-tr-xl"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-nature-500 rounded-bl-xl"></div>
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-nature-500 rounded-br-xl"></div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {t('identifying')} 
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-gray-900 rounded-full animate-bounce delay-200"></span>
              </span>
            </h3>
            
            <div className="h-8 overflow-hidden relative w-full max-w-md text-center">
               <p key={loadingTipIndex} className="text-nature-600 font-medium animate-fade-in-up absolute w-full">
                  {loadingTips[loadingTipIndex]}
               </p>
            </div>

            <style>{`
              @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
              }
              @keyframes fade-in-up {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                animation: fade-in-up 0.5s ease-out forwards;
              }
            `}</style>
          </div>
        )}

        {appState === AppState.SELECTING && (
          <PlantSelector 
            candidates={candidates}
            onSelect={handleCandidateSelect}
            onCancel={resetApp}
          />
        )}

        {appState === AppState.ERROR && (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-red-50 inline-block p-6 rounded-full mb-6">
              <Leaf className="w-12 h-12 text-red-500 rotate-180" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('error_title')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
            <button 
              onClick={resetApp}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-all shadow-lg"
            >
              {t('try_again')}
            </button>
          </div>
        )}

        {appState === AppState.SUCCESS && plantData && imagePreview && (
          <ResultCard 
            data={plantData} 
            imagePreview={imagePreview} 
            onReset={resetApp} 
            onSave={savePlantToGarden}
            isSaved={isCurrentPlantSaved}
            onUpgrade={() => setIsPricingModalOpen(true)}
          />
        )}

        {appState === AppState.GARDEN && (
          <GardenGallery 
            savedPlants={savedPlants}
            onSelectPlant={openPlantDetails}
            onDeletePlant={deletePlantFromGarden}
            onScanNew={resetApp}
          />
        )}

      </main>
       <div className="py-6 text-center text-xs text-gray-400 no-print w-full bg-white/50 backdrop-blur-sm">
         {t('app_footer_credit')}
       </div>
    </div>
  );
};

