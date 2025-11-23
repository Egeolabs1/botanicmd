import React, { useState, useEffect } from 'react';
import { Share2, X, Smartphone } from './Icons';
import { useLanguage } from '../i18n';

export const PWAInstallPrompt: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    // Verifica múltiplas formas de detectar PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidStandalone = document.referrer.includes('android-app://');
    const actuallyInstalled = isStandalone || isIOSStandalone || isAndroidStandalone;

    // Não mostra se já estiver instalado
    if (actuallyInstalled) {
      return;
    }

    // Para iOS, sempre mostra após delay
    if (isIosDevice) {
      setIsIOS(true);
      setTimeout(() => setShowPrompt(true), 2000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para Android e outros, mostra após delay mesmo sem o evento
    if (isAndroidDevice || (!isIosDevice && !actuallyInstalled)) {
      setTimeout(() => {
        // Mostra o banner mesmo sem o evento beforeinstallprompt
        // O usuário pode usar instruções manuais ou o navegador pode mostrar o prompt
        if (!showPrompt) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Para iOS, mostra instruções detalhadas
      const instructions = `Para instalar o BotanicMD no iOS:

1. Toque no botão de Compartilhar (Share) na parte inferior da tela (ícone de quadrado com seta para cima)

2. Role para baixo e toque em "Adicionar à Tela de Início" (Add to Home Screen)

3. Toque em "Adicionar" para confirmar

Pronto! O app estará disponível na sua tela inicial.`;

      alert(instructions);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setShowPrompt(false);
          alert('App instalado com sucesso! ✅');
        } else {
          console.log('Usuário cancelou a instalação');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Erro ao mostrar prompt de instalação:', error);
        // Fallback: mostra instruções manuais
        const instructions = `Para instalar o BotanicMD:

1. Toque no menu do navegador (3 pontos no canto superior direito)

2. Procure por "Instalar app" ou "Adicionar à tela inicial"

3. Siga as instruções para instalar

Alternativamente, alguns navegadores mostram um banner na parte superior da tela para instalar o app.`;

        alert(instructions);
      }
    } else {
      // Se não tem deferredPrompt, mostra instruções manuais
      const instructions = `Para instalar o BotanicMD:

1. Toque no menu do navegador (3 pontos no canto superior direito)

2. Procure por "Instalar app" ou "Adicionar à tela inicial"

3. Siga as instruções para instalar

Alternativamente, alguns navegadores mostram um banner na parte superior da tela para instalar o app.`;

      alert(instructions);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-nature-100 p-4 max-w-md mx-auto relative">
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="bg-nature-100 p-3 rounded-xl text-nature-600 shrink-0">
            <Smartphone className="w-8 h-8" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{t('pwa_install')}</h3>
            
            {isIOS ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Instale o BotanicMD no seu dispositivo iOS para uma experiência melhor!
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-nature-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-nature-700 transition-colors shadow-md"
                >
                  Ver Instruções
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t('pwa_desc') || 'Instale o BotanicMD no seu dispositivo para acesso rápido e uma experiência melhor!'}
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-nature-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-nature-700 transition-colors shadow-md"
                >
                  {t('install_btn') || 'Instalar App'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};