// Tracking & SEO Configuration Service

export interface TrackingConfig {
  googleSearchConsole?: string;  // Verification code
  googleAnalytics?: string;       // GA4 Measurement ID (G-XXXXXXXXXX)
  googleTagManager?: string;      // GTM ID (GTM-XXXXXXX)
  facebookPixel?: string;         // Facebook Pixel ID
  tiktokPixel?: string;          // TikTok Pixel ID
  linkedInInsight?: string;      // LinkedIn Partner ID
  hotjar?: string;               // Hotjar Site ID
  clarity?: string;              // Microsoft Clarity Project ID
  customHeader?: string;         // Custom HTML for <head>
  customBody?: string;           // Custom HTML for <body>
}

const STORAGE_KEY = 'botanicmd_tracking_config';

class TrackingService {
  private config: TrackingConfig = {};
  private initialized = false;

  constructor() {
    this.loadConfig();
  }

  // Load configuration from localStorage
  loadConfig(): TrackingConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load tracking config:', error);
    }
    return this.config;
  }

  // Save configuration to localStorage
  saveConfig(config: TrackingConfig): void {
    try {
      this.config = config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      
      // Reinitialize tracking with new config
      this.initialize();
    } catch (error) {
      console.error('Failed to save tracking config:', error);
    }
  }

  // Get current configuration
  getConfig(): TrackingConfig {
    return { ...this.config };
  }

  // Initialize all tracking scripts
  initialize(): void {
    if (this.initialized) {
      // Remove old scripts before reinitializing
      this.cleanup();
    }

    // Google Analytics (GA4)
    if (this.config.googleAnalytics) {
      this.initGoogleAnalytics(this.config.googleAnalytics);
    }

    // Google Tag Manager
    if (this.config.googleTagManager) {
      this.initGoogleTagManager(this.config.googleTagManager);
    }

    // Facebook Pixel
    if (this.config.facebookPixel) {
      this.initFacebookPixel(this.config.facebookPixel);
    }

    // TikTok Pixel
    if (this.config.tiktokPixel) {
      this.initTikTokPixel(this.config.tiktokPixel);
    }

    // Hotjar
    if (this.config.hotjar) {
      this.initHotjar(this.config.hotjar);
    }

    // Microsoft Clarity
    if (this.config.clarity) {
      this.initClarity(this.config.clarity);
    }

    // Google Search Console verification (meta tag)
    if (this.config.googleSearchConsole) {
      this.addMetaTag('google-site-verification', this.config.googleSearchConsole);
    }

    // Custom header scripts
    if (this.config.customHeader) {
      this.injectCustomHTML(this.config.customHeader, 'head');
    }

    // Custom body scripts
    if (this.config.customBody) {
      this.injectCustomHTML(this.config.customBody, 'body');
    }

    this.initialized = true;
  }

  // Google Analytics (GA4)
  private initGoogleAnalytics(measurementId: string): void {
    // Verifica se o GA já está carregado (pode estar no index.html)
    if ((window as any).gtag) {
      console.log('ℹ️ Google Analytics já está carregado no HTML');
      // Adiciona configuração adicional se for um ID diferente
      if (measurementId && measurementId !== 'G-48KXSDJQ7B') {
        (window as any).gtag('config', measurementId);
        console.log('✅ Google Analytics configurado com ID adicional:', measurementId);
      }
      return;
    }

    // Add gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.setAttribute('data-tracking', 'google-analytics');
    document.head.appendChild(script);

    // Add gtag config
    const configScript = document.createElement('script');
    configScript.setAttribute('data-tracking', 'google-analytics-config');
    configScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        'send_page_view': true,
        'anonymize_ip': true
      });
    `;
    document.head.appendChild(configScript);
  }

  // Google Tag Manager
  private initGoogleTagManager(gtmId: string): void {
    // Add GTM script to head
    const headScript = document.createElement('script');
    headScript.setAttribute('data-tracking', 'google-tag-manager');
    headScript.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(headScript);

    // Add GTM noscript to body
    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-tracking', 'google-tag-manager-noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }

  // Facebook Pixel
  private initFacebookPixel(pixelId: string): void {
    const script = document.createElement('script');
    script.setAttribute('data-tracking', 'facebook-pixel');
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  // TikTok Pixel
  private initTikTokPixel(pixelId: string): void {
    const script = document.createElement('script');
    script.setAttribute('data-tracking', 'tiktok-pixel');
    script.textContent = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }

  // Hotjar
  private initHotjar(siteId: string): void {
    const script = document.createElement('script');
    script.setAttribute('data-tracking', 'hotjar');
    script.textContent = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${siteId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }

  // Microsoft Clarity
  private initClarity(projectId: string): void {
    const script = document.createElement('script');
    script.setAttribute('data-tracking', 'clarity');
    script.textContent = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");
    `;
    document.head.appendChild(script);
  }

  // Add meta tag
  private addMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      meta.setAttribute('data-tracking', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  // Inject custom HTML
  private injectCustomHTML(html: string, target: 'head' | 'body'): void {
    const container = document.createElement('div');
    container.setAttribute('data-tracking', `custom-${target}`);
    container.innerHTML = html;
    
    const targetElement = target === 'head' ? document.head : document.body;
    targetElement.appendChild(container);
  }

  // Clean up all tracking scripts
  private cleanup(): void {
    // Remove all elements with data-tracking attribute
    document.querySelectorAll('[data-tracking]').forEach(el => el.remove());
    
    // Clear global tracking objects
    // Não tenta deletar gtag pois pode ser não-configurável
    // Apenas remove a referência se possível
    try {
      if ((window as any).gtag && delete (window as any).gtag) {
        // Deletado com sucesso
      }
    } catch (error) {
      // Ignora erro se não puder deletar (propriedade não-configurável)
    }
    if ((window as any).dataLayer) delete (window as any).dataLayer;
    if ((window as any).fbq) delete (window as any).fbq;
    if ((window as any).ttq) delete (window as any).ttq;
    if ((window as any).hj) delete (window as any).hj;
    if ((window as any).clarity) delete (window as any).clarity;
  }

  // Track custom event (works with GA4 and GTM)
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    // Google Analytics
    if (this.config.googleAnalytics && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }

    // Facebook Pixel
    if (this.config.facebookPixel && (window as any).fbq) {
      (window as any).fbq('track', eventName, eventParams);
    }

    // TikTok Pixel
    if (this.config.tiktokPixel && (window as any).ttq) {
      (window as any).ttq.track(eventName, eventParams);
    }
  }
}

export const trackingService = new TrackingService();


