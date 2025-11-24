// Service Worker Simplificado - v2.1
// Força atualização do cache para resolver problemas de login

const CACHE_NAME = 'botanicmd-cache-v2.1';
const DYNAMIC_CACHE = 'botanicmd-dynamic-v2.1';

// Arquivos essenciais para o app shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/robots.txt'
];

// Instalação: Cache dos arquivos estáticos
self.addEventListener('install', (event) => {
  // Força o novo SW a assumir o controle imediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  // Reivindica o controle de todas as abas abertas imediatamente
  event.waitUntil(clients.claim());
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch: Estratégia Network First para navegação e API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições externas (Google Fonts, etc.) exceto as imagens do Supabase/plantas
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase')) {
    return;
  }
  
  // Ignora rotas de autenticação para garantir que sempre vai para a rede
  if (url.pathname.includes('/auth/') || url.pathname.includes('/callback')) {
    return;
  }

  // Para navegação (HTML) e API: Network First
  // Isso garante que o usuário sempre veja a versão mais recente se estiver online
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            // Guarda uma cópia para offline
            cache.put(event.request.url, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Se falhar (offline), tenta o cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para assets estáticos (JS, CSS, Imagens): Stale While Revalidate
  // Retorna o cache rápido, mas atualiza em background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});
