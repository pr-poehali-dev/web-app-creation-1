// Service Worker для кэширования и ускорения загрузки
const CACHE_NAME = 'erttp-v3';
const STATIC_CACHE = 'erttp-static-v3';
const DYNAMIC_CACHE = 'erttp-dynamic-v3';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES.map(url => new Request(url, { cache: 'reload' })));
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const { url } = event.request;
  
  // Стратегия для CDN (изображения) - Cache First
  if (url.includes('cdn.poehali.dev')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // Стратегия для статики - Cache First с обновлением
  if (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((fetchResponse) => {
          caches.open(STATIC_CACHE).then((cache) => {
            if (fetchResponse.ok) {
              cache.put(event.request, fetchResponse.clone());
            }
          });
          return fetchResponse;
        });
        return response || fetchPromise;
      })
    );
    return;
  }
  
  // Для остальных запросов - Network First
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('erttp-') && name !== CACHE_NAME && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});