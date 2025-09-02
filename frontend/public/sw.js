/* App-shell SW (Vite/CRA safe) */
const CACHE_NAME = 'binaiot-app-shell-v2';
const CORE_ASSETS = [
  '/',                 // SPA entry
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico'
];

// Detect dev (e.g., Vite on 5173/5174) right inside the SW
const DEV_PORTS = new Set(['5173','5174']);
const isDev = DEV_PORTS.has(self.location.port);

// Install: pre-cache app shell (prod only)
self.addEventListener('install', (event) => {
  if (isDev) {
    // In dev, don’t pre-cache to avoid stale index.html
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Always bypass Vite dev/HMR and source modules
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/src/')
  ) {
    return; // let the network handle it
  }

  // 2) SPA navigations: network-first (fall back to cached index on offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch('/index.html', { cache: 'no-store' })
        .then((resp) => {
          // cache fresh copy (prod only)
          if (!isDev) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy));
          }
          return resp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 3) API calls (network-first with cache fallback)
  if (/^https?:\/\/(192\.168\.100\.59|localhost|127\.0\.0\.1):8000\/.*/.test(request.url)) {
    event.respondWith(
      fetch(request)
        .then((networkResp) => {
          const copy = networkResp.clone();
          caches.open('api-cache').then((c) => c.put(request, copy));
          return networkResp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4) Same-origin static: cache-first (fine for prod)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
