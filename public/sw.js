const CACHE_VERSION = 'v1.2.0';
const CDN_CACHE = `cdn-${CACHE_VERSION}`;

// Кэшируем ТОЛЬКО картинки с CDN — никаких JS/CSS
const CDN_HOSTS = ['cdn.poehali.dev'];

// API — никогда не кэшируем
const API_HOSTS = ['functions.poehali.dev', 'mc.yandex.ru'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CDN_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Только GET
  if (event.request.method !== 'GET') return;

  // API — не трогаем
  if (API_HOSTS.some((h) => url.hostname.includes(h))) return;

  // Не http — не трогаем
  if (!url.protocol.startsWith('http')) return;

  // JS/CSS/HTML приложения — ВСЕГДА из сети, никогда из кэша
  if (url.hostname === self.location.hostname) return;

  // CDN картинки — cache first
  if (CDN_HOSTS.some((h) => url.hostname.includes(h))) {
    const isImage = url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff2?)$/i);
    if (isImage) {
      event.respondWith(
        caches.open(CDN_CACHE).then(async (cache) => {
          const cached = await cache.match(event.request);
          if (cached) return cached;
          const response = await fetch(event.request).catch(() => null);
          if (response && response.ok) cache.put(event.request, response.clone());
          return response || new Response('', { status: 408 });
        })
      );
    }
    return;
  }
});

// Push-уведомления
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

function playRingSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
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
      self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        tag: notificationData.tag,
        requireInteraction: notificationData.requireInteraction,
      }),
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const callData = notificationData.data && notificationData.data.callData;
        const isInvite = notificationData.data && notificationData.data.type === 'online_invite';

        if (clientList.length > 0) {
          const pushType = notificationData.data && notificationData.data.type;
          clientList.forEach((client) => {
            if (isInvite) {
              client.postMessage({ type: 'PLAY_INVITE_RING' });
            } else {
              client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
            }
            if (callData) {
              client.postMessage({ type: 'INCOMING_VIDEO_CALL', callData });
            }
            client.postMessage({ type: 'REFRESH_UNREAD' });
            if (pushType === 'new_order' || pushType === 'order_update') {
              client.postMessage({ type: 'REFRESH_ORDERS' });
            }
          });
        } else {
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const relativeUrl = event.notification.data?.url || '/';
  const callData = event.notification.data?.callData || null;

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
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl });
            if (callData) {
              client.postMessage({ type: 'INCOMING_VIDEO_CALL', callData });
            }
          });
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});