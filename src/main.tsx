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

// Убираем HTML splash как только React отрендерился
requestAnimationFrame(() => {
  const splash = document.getElementById('html-splash');
  if (splash) {
    splash.style.transition = 'opacity 0.3s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 300);
  }
});



if ('serviceWorker' in navigator) {
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 2000);
}