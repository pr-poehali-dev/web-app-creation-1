const CACHE_VERSION = 'v1.0.3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Хосты API — никогда не кэшируем
const API_HOSTS = [
  'functions.poehali.dev',
  'mc.yandex.ru',
];

// Хосты статики — кэшируем агрессивно
const CDN_HOSTS = [
  'cdn.poehali.dev',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ]).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Пропускаем не-GET запросы напрямую
  if (event.request.method !== 'GET') return;

  // Пропускаем API — всегда свежие данные с сервера
  if (API_HOSTS.some((h) => url.hostname.includes(h))) return;

  // Пропускаем chrome-extension и прочее
  if (!url.protocol.startsWith('http')) return;

  // CDN картинки — cache first (берём из кэша, обновляем в фоне)
  if (CDN_HOSTS.some((h) => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // JS/CSS/шрифты приложения — cache first
  const isAsset = url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|svg|ico|webp|jpg|jpeg)$/);
  if (isAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      })
    );
    return;
  }

  // HTML навигация — network first (свежий HTML, но fallback на кэш)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        caches.open(STATIC_CACHE).then((cache) => {
          if (response.ok) cache.put(event.request, response.clone());
        });
        return response;
      }).catch(async () => {
        const cached = await caches.match('/');
        return cached || new Response('Нет соединения с интернетом', { status: 503 });
      })
    );
    return;
  }
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'ЕРТТП',
    body: 'У вас новое уведомление',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
      };
    } catch (e) {}
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
    })
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            return client.postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
          });
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
