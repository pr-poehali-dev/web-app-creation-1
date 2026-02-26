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

// Убираем splash screen после монтирования React
requestAnimationFrame(() => {
  setTimeout(() => {
    if (typeof (window as Window & { __hideSplash?: () => void }).__hideSplash === 'function') {
      (window as Window & { __hideSplash?: () => void }).__hideSplash!();
    }
  }, 300);
});

if ('serviceWorker' in navigator) {
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 2000);
}