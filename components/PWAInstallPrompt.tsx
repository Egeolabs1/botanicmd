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
    // @ts-ignore
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setTimeout(() => setShowPrompt(true), 3000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
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
              <div className="text-sm text-gray-600">
                <p className="mb-2">iOS:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li><span className="inline-block align-middle"><Share2 className="w-3 h-3" /></span> Share</li>
                  <li><strong>Add to Home Screen</strong></li>
                </ol>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {t('pwa_desc')}
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-nature-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-nature-700 transition-colors shadow-md"
                >
                  {t('install_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};