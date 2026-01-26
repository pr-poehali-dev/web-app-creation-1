import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, 2000);
}