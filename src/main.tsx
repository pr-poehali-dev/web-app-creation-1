import * as React from 'react';
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Убираем HTML splash с задержкой — даём React время отрисовать первый экран
const emergencyTimer = setTimeout(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    const btn = document.createElement('button');
    btn.textContent = 'Обновить страницу';
    btn.style.cssText = 'margin-top:8px;padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;';
    btn.onclick = () => location.reload();
    splash.appendChild(btn);
  }
}, 15000);

setTimeout(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    clearTimeout(emergencyTimer);
    splash.style.transition = 'opacity 0.4s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }
}, 600);



// Обработчик ошибок чанков (устаревший кэш на iOS)
window.addEventListener('error', (e) => {
  const isChunkError =
    e.message?.includes('Failed to fetch dynamically imported module') ||
    e.message?.includes('Importing a module script failed') ||
    e.message?.includes('Unable to preload CSS') ||
    (e as ErrorEvent).filename?.includes('/assets/');
  if (isChunkError) {
    const reloadKey = 'chunk-error-reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        }).finally(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  }
});

if ('serviceWorker' in navigator) {
  // Сначала — сбросить все старые SW и кеш, если есть проблемы
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    // Если SW уже есть — проверим актуальность через fetch sw.js
    if (registrations.length > 0) {
      fetch('/sw.js?_v=' + Date.now(), { cache: 'no-store' })
        .then(r => r.text())
        .then(text => {
          const match = text.match(/CACHE_VERSION\s*=\s*'([^']+)'/);
          const serverVersion = match ? match[1] : null;
          registrations.forEach(reg => {
            // Принудительно проверяем обновление
            reg.update().catch(() => {});
          });
          // Если версия в SW не совпадает — чистим кеш немедленно
          const cachedVersion = localStorage.getItem('sw_cache_version');
          if (serverVersion && cachedVersion !== serverVersion) {
            localStorage.setItem('sw_cache_version', serverVersion);
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).catch(() => {});
          }
        }).catch(() => {});
    }
  }).catch(() => {});

  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Если есть ожидающий SW — активируем сразу
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Новый SW установлен — очищаем кеш и перезагружаем
              caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
                .finally(() => window.location.reload());
            }
          });
        }
      });
    }).catch(() => {});
  }, 1000);
}