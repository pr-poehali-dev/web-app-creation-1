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
setTimeout(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    splash.style.transition = 'opacity 0.4s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }
}, 600);

// Аварийный выход из splash — если React не запустился за 15 сек (медленная сеть)
setTimeout(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    const btn = document.createElement('button');
    btn.textContent = 'Обновить страницу';
    btn.style.cssText = 'margin-top:8px;padding:12px 24px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;';
    btn.onclick = () => location.reload();
    splash.appendChild(btn);
  }
}, 15000);



if ('serviceWorker' in navigator) {
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 2000);
}