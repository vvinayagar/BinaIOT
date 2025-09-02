import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';

// Ensure #root exists and is typed correctly
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Root element with id 'root' not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint.
reportWebVitals();

// --- Service Worker registration ---
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(regs => {
//     regs.forEach(r => r.unregister());
//   });
//   caches.keys().then(keys => keys.forEach(k => caches.delete(k)));

//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/sw.js')   // ✅ simpler, no process.env
//       .then((reg) => {
//         console.log('Service Worker registered:', reg);
//       })
//       .catch((err) => {
//         console.error('Service Worker registration failed:', err);
//       });
//   });

// }

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  (async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    // Do NOT register a SW in dev
  })();
}

// PROD: register and let the SW control the page
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('SW registered', reg);

      // Optional: handle updates nicely
      reg.addEventListener?.('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New version ready (next reload will use it).');
            // or postMessage({type:'SKIP_WAITING'}) and reload after controllerchange
          }
        });
      });
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}

// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/sw.js')   // ✅ simpler, no process.env
//       .then((reg) => {
//         console.log('Service Worker registered:', reg);
//       })
//       .catch((err) => {
//         console.error('Service Worker registration failed:', err);
//       });
//   });
// }
