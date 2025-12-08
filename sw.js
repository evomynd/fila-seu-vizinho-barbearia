const CACHE_NAME = 'seu-vizinho-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Tenta fazer cache apenas dos arquivos locais
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url))
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignorar requisições para CDN externos (evitar CORS)
  if (request.url.includes('cdn.tailwindcss.com') ||
      request.url.includes('gstatic.googleapis.com')) {
    return; // Deixa passar normalmente sem cache
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Só fazer cache de requisições GET bem-sucedidas
          if (request.method === 'GET' && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cached); // Se falhar, tenta cache
      
      return cached || fetchPromise;
    })
  );
});
