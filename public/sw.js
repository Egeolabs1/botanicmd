// ⚠️ IMPORTANTE: Incremente a versão do cache quando houver mudanças significativas
// Isso força a atualização do cache para todos os usuários
// Incrementado para v3 para forçar limpeza do loop infinito anterior
const CACHE_VERSION = 'botanicmd-v3';
const CACHE_NAME = CACHE_VERSION;

// Estratégia: Network First para assets dinâmicos (com hash), Cache First para arquivos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  // Não cachear assets na instalação - deixar para Network First
  self.skipWaiting();
});

// Limpeza de caches antigos na ativação
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION + '...');
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Força a ativação imediata para todos os clients
      self.clients.claim()
    ])
  );
});

// Escuta mensagens dos clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Interceptação de requisições com estratégia inteligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora requisições de API (devem sempre ir para a rede)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Ignora requisições externas (Google Fonts, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  // Estratégia: Network First para assets dinâmicos (CSS/JS com hash)
  // Isso garante que sempre busca a versão mais recente do servidor
  if (url.pathname.includes('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.mjs')) {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a rede funcionar, cacheia a resposta e retorna
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, tenta buscar no cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não tiver no cache também, retorna erro
            return new Response('Asset not found', { status: 404 });
          });
        })
    );
    return;
  }

  // Para HTML e outros arquivos estáticos: Network First com fallback para cache
  if (url.pathname === '/' || url.pathname.endsWith('.html') || 
      url.pathname === '/manifest.json' || url.pathname === '/icon.svg') {
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cacheia apenas se a resposta for válida
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache se a rede falhar
          return caches.match(request);
        })
    );
    return;
  }
});
