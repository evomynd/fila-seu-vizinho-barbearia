// Service Worker para BarberQueue PWA
const CACHE_NAME = 'barberqueue-v1.0.0';
const urlsToCache = [
  './APPBARBER.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Erro ao cachear arquivos:', err);
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', event => {
  // Ignorar requisições do Firebase e externa
  if (
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.url.includes('firebaseapp.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar a resposta porque ela pode ser usada apenas uma vez
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tentar buscar do cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          // Se não houver no cache, retornar uma resposta padrão
          if (event.request.mode === 'navigate') {
            return caches.match('./APPBARBER.html');
          }
        });
      })
  );
});

// Mensagens do Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
