// Service Worker для кэширования статики
const CACHE_NAME = 'erttp-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Кэшируем только GET запросы
  if (event.request.method !== 'GET') return;
  
  // Кэшируем изображения
  if (event.request.url.includes('cdn.poehali.dev')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});