import * as React from 'react';
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

// Убираем сплэш — вызывается из App после первого рендера
export function removeSplash() {
  const splash = document.getElementById('html-splash');
  if (splash && splash.parentNode) {
    splash.style.transition = 'opacity 0.3s ease';
    splash.style.opacity = '0';
    setTimeout(() => {
      if (splash.parentNode) splash.remove();
    }, 300);
  }
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Аварийный таймер — если React не смог запуститься за 20 сек, показываем кнопку
setTimeout(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    const btn = document.createElement('button');
    btn.textContent = 'Обновить страницу';
    btn.style.cssText = 'margin-top:16px;padding:14px 28px;background:#3b82f6;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;';
    btn.onclick = () => {
      if ('caches' in window) {
        caches.keys().then((names) => names.forEach((n) => caches.delete(n))).finally(() => location.reload());
      } else {
        location.reload();
      }
    };
    // Не добавляем если кнопка уже есть
    if (!splash.querySelector('button')) splash.appendChild(btn);
  }
}, 20000);

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
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 3000);
}
