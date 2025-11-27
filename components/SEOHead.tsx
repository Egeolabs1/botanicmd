import { useEffect } from 'react';
import { useLanguage } from '../i18n';

// Helper functions to get translated schemas
export const getOrganizationSchema = (t: any, language: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BotanicMD",
  "url": "https://botanicmd.com",
  "logo": "https://botanicmd.com/icon.svg",
  "description": t('seo_org_description'),
  "founder": {
    "@type": "Organization",
    "name": "Egeolabs"
  },
  "sameAs": [],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "10000",
    "bestRating": "5",
    "worstRating": "1"
  }
});

export const getWebApplicationSchema = (t: any, language: string) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BotanicMD",
  "url": "https://botanicmd.com",
  "description": t('seo_app_description'),
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": language === 'pt' ? 'BRL' : 'USD'
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "10000",
    "bestRating": "5",
    "worstRating": "1"
  }
});

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  structuredData?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image = 'https://botanicmd.com/og-image.jpg',
  url = 'https://botanicmd.com/',
  type = 'website',
  noindex = false,
  structuredData
}) => {
  const { t, language } = useLanguage();

  // Default values based on language
  const defaultTitle = t('app_name') + ' - ' + t('tagline');
  const defaultDescription = t('hero_subtitle');

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', finalDescription);
    const finalKeywords = keywords || t('seo_keywords');
    if (finalKeywords) updateMetaTag('keywords', finalKeywords);
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:image:alt', finalTitle, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    const currentLocale = language === 'pt' ? 'pt_BR' : `${language}_${language.toUpperCase()}`;
    updateMetaTag('og:locale', currentLocale, true);
    
    // Open Graph - Locales alternativos para múltiplos idiomas
    const supportedLanguages = [
      { code: 'pt', locale: 'pt_BR' },
      { code: 'en', locale: 'en_US' },
      { code: 'es', locale: 'es_ES' },
      { code: 'fr', locale: 'fr_FR' },
      { code: 'de', locale: 'de_DE' },
      { code: 'it', locale: 'it_IT' },
      { code: 'zh', locale: 'zh_CN' },
      { code: 'ru', locale: 'ru_RU' },
      { code: 'hi', locale: 'hi_IN' }
    ];
    
    supportedLanguages.forEach(({ code, locale }) => {
      if (code !== language) {
        updateMetaTag(`og:locale:alternate`, locale, true);
      }
    });

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', finalTitle, true);
    updateMetaTag('twitter:description', finalDescription, true);
    updateMetaTag('twitter:image', image, true);
    updateMetaTag('twitter:image:alt', finalTitle, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Structured Data (JSON-LD)
    if (structuredData) {
      // Remove old structured data scripts
      const oldScripts = document.querySelectorAll('script[type="application/ld+json"]');
      oldScripts.forEach(script => script.remove());
      
      // Add new structured data (can be array or single object)
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      dataArray.forEach((data, index) => {
        const scriptId = `structured-data-${index}`;
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    // HTML lang attribute
    const htmlLang = language === 'pt' ? 'pt-BR' : 
                     language === 'zh' ? 'zh-CN' :
                     language === 'hi' ? 'hi-IN' : language;
    document.documentElement.lang = htmlLang;

    // Hreflang tags para múltiplos idiomas
    const addHreflangTags = (baseUrl: string, currentLang: string) => {
      // Remove hreflang existentes
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
      
      const supportedLanguages = [
        { code: 'pt', hreflang: 'pt-BR' },
        { code: 'en', hreflang: 'en-US' },
        { code: 'es', hreflang: 'es-ES' },
        { code: 'fr', hreflang: 'fr-FR' },
        { code: 'de', hreflang: 'de-DE' },
        { code: 'it', hreflang: 'it-IT' },
        { code: 'zh', hreflang: 'zh-CN' },
        { code: 'ru', hreflang: 'ru-RU' },
        { code: 'hi', hreflang: 'hi-IN' }
      ];

      // Adiciona hreflang para cada idioma
      supportedLanguages.forEach(({ code, hreflang }) => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', hreflang);
        // Preserva query params existentes ou adiciona lang
        const separator = baseUrl.includes('?') ? '&' : '?';
        link.setAttribute('href', `${baseUrl}${separator}lang=${code}`);
        document.head.appendChild(link);
      });

      // x-default aponta para inglês (idioma padrão)
      const xDefault = document.createElement('link');
      xDefault.setAttribute('rel', 'alternate');
      xDefault.setAttribute('hreflang', 'x-default');
      const separator = baseUrl.includes('?') ? '&' : '?';
      xDefault.setAttribute('href', `${baseUrl}${separator}lang=en`);
      document.head.appendChild(xDefault);
    };

    addHreflangTags(url, language);

  }, [finalTitle, finalDescription, keywords, image, url, type, noindex, language, structuredData]);

  return null; // This component doesn't render anything
};


export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export const blogPostSchema = (
  title: string, 
  description: string, 
  author: string, 
  datePublished: string, 
  image: string,
  url: string,
  category: string,
  keywords: string,
  language: string = 'en',
  dateModified?: string
) => {
  // Calcula word count aproximado do conteúdo
  const wordCount = description.split(/\s+/).length + title.split(/\s+/).length;
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "image": {
      "@type": "ImageObject",
      "url": image,
      "width": 1200,
      "height": 630
    },
    "inLanguage": language,
    "keywords": keywords,
    "articleSection": category,
    "wordCount": wordCount,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "publisher": {
      "@type": "Organization",
      "name": "BotanicMD",
      "logo": {
        "@type": "ImageObject",
        "url": "https://botanicmd.com/icon.svg",
        "width": 512,
        "height": 512
      }
    }
  };
};

export const breadcrumbSchema = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const howToSchema = (steps: Array<{name: string, text: string, image?: string}>) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Identify Plants with BotanicMD",
  "description": "Step-by-step guide to identify plants using AI-powered technology",
  "step": steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
    ...(step.image && { "image": step.image })
  }))
});

export const getSoftwareApplicationSchema = (t: any, language: string) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BotanicMD",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web, iOS, Android",
  "url": "https://botanicmd.com",
  "description": t('seo_app_description'),
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": language === 'pt' ? 'BRL' : 'USD'
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "10000",
    "bestRating": "5",
    "worstRating": "1"
  },
  "screenshot": "https://botanicmd.com/og-image.jpg"
});


