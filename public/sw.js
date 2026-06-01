const CACHE_VERSION = 'v1.1.0';
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
    }).then(() => self.clients.claim()).then(() => {
      // Уведомляем все открытые вкладки о новой версии — они перезагрузятся
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
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

  // HTML навигация — network first, всегда отдаём свежий index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch('/').then((response) => {
        if (response.ok) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put('/', response.clone());
          });
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match('/');
        return cached || fetch(event.request);
      })
    );
    return;
  }
});

// Короткий бип — обычное уведомление
function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const freqs = [880, 1100];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.22);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.25);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {}
}

// Длинный телефонный звонок — для приглашения в чат
function playRingSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    // 3 пары импульсов — как телефонный звонок
    const pulses = [
      { freq: 880, time: 0 },    { freq: 1100, time: 0.15 },
      { freq: 880, time: 0.45 }, { freq: 1100, time: 0.60 },
      { freq: 880, time: 0.90 }, { freq: 1100, time: 1.05 },
    ];
    pulses.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.4, now + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.18);
      osc.start(now + time);
      osc.stop(now + time + 0.22);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {}
}

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
    Promise.all([
      // Показываем уведомление
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
      }),
      // Уведомляем открытые вкладки + играем нужный звук
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const callData = notificationData.data && notificationData.data.callData;
        const isInvite = notificationData.data && notificationData.data.type === 'online_invite';

        if (clientList.length > 0) {
          clientList.forEach((client) => {
            if (isInvite) {
              // Приглашение в чат — длинный звонок
              client.postMessage({ type: 'PLAY_INVITE_RING' });
            } else {
              client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
            }
            if (callData) {
              client.postMessage({ type: 'INCOMING_VIDEO_CALL', callData });
            }
          });
        } else {
          // Вкладка закрыта — играем через AudioContext прямо в SW
          if (isInvite) {
            playRingSound();
          } else {
            playNotificationSound();
          }
        }
      }),
    ])
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const relativeUrl = event.notification.data?.url || '/';
  const callData = event.notification.data?.callData || null;

  // Если это видеозвонок — добавляем callData в URL как параметр
  let targetUrl = relativeUrl;
  if (callData) {
    try {
      const encoded = btoa(JSON.stringify(callData));
      const sep = relativeUrl.includes('?') ? '&' : '?';
      targetUrl = relativeUrl + sep + 'vcall=' + encodeURIComponent(encoded);
    } catch (e) {}
  }

  const urlToOpen = targetUrl.startsWith('http') ? targetUrl : (self.location.origin + targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Передаём и навигацию и callData через postMessage
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
            if (callData) {
              client.postMessage({ type: 'INCOMING_VIDEO_CALL', callData });
            }
          });
        }
      }
      // Вкладка не открыта — открываем с callData в URL
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});