// Service Worker для кэширования и push-уведомлений
const CACHE_NAME = 'erttp-v3';
const STATIC_CACHE = 'erttp-static-v3';
const DYNAMIC_CACHE = 'erttp-dynamic-v3';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
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
  console.log('[SW] Activating service worker...');
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

// ========== PUSH NOTIFICATIONS ==========

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let data = { 
    title: 'Новое уведомление', 
    body: 'У вас новое уведомление', 
    icon: '/favicon.ico' 
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/',
      orderId: data.orderId,
      type: data.type
    },
    tag: data.tag || `notification-${Date.now()}`,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Если окно приложения уже открыто - фокусируем его
        for (let client of clientList) {
          if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
            return client.focus();
          }
        }
        // Если нет открытого окна - открываем новое
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});