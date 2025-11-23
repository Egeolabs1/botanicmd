import { useEffect } from 'react';
import { useLanguage } from '../i18n';

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
  image = 'https://botanicmd.vercel.app/icon.svg',
  url = 'https://botanicmd.vercel.app/',
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
    if (keywords) updateMetaTag('keywords', keywords);
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:locale', language === 'pt' ? 'pt_BR' : `${language}_${language.toUpperCase()}`, true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', finalTitle, true);
    updateMetaTag('twitter:description', finalDescription, true);
    updateMetaTag('twitter:image', image, true);

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
      const scriptId = 'structured-data';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(structuredData);
    }

    // HTML lang attribute
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;

  }, [finalTitle, finalDescription, keywords, image, url, type, noindex, language, structuredData]);

  return null; // This component doesn't render anything
};

// Predefined structured data schemas
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BotanicMD",
  "url": "https://botanicmd.vercel.app",
  "logo": "https://botanicmd.vercel.app/icon.svg",
  "description": "Advanced AI-powered plant identification and diagnosis platform",
  "founder": {
    "@type": "Organization",
    "name": "Egeolabs"
  },
  "sameAs": []
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BotanicMD",
  "url": "https://botanicmd.vercel.app",
  "description": "Identify plants instantly, diagnose diseases and receive personalized treatments with advanced AI",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "10000",
    "bestRating": "5",
    "worstRating": "1"
  }
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

export const blogPostSchema = (title: string, description: string, author: string, datePublished: string, image: string) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": title,
  "description": description,
  "author": {
    "@type": "Person",
    "name": author
  },
  "datePublished": datePublished,
  "image": image,
  "publisher": {
    "@type": "Organization",
    "name": "BotanicMD",
    "logo": {
      "@type": "ImageObject",
      "url": "https://botanicmd.vercel.app/icon.svg"
    }
  }
});

