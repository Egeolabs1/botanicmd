import { useState, useEffect } from 'react';

/**
 * Hook para detectar se o app está rodando como PWA instalado
 * (modo standalone)
 */
export const useIsPWA = (): boolean => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detecta se está em modo standalone (PWA instalado)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore - iOS Safari
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsPWA(isStandalone);
  }, []);

  return isPWA;
};

