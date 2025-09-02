import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const LogRequests = {
  name: 'log-requests',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      try {
        console.log('[REQ]', req.url) // raw, undecoded URL
      } catch {}
      next()
    })
  }
}

export default defineConfig({
   base: '/',
  server: { hmr: { overlay: true } },
  plugins: [
    
    LogRequests,
    react(),
    VitePWA({
      registerType: 'autoUpdate',       // updates SW in background
      includeAssets: ['favicon.svg','robots.txt','apple-touch-icon.png'],
      devOptions: { enabled: false } ,
      manifest: {
        name: 'BinaIOT',
        short_name: 'BinaIOT',
        description: 'Modbus dashboard',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#111827',
        theme_color: '#0ea5e9',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/assets'),
            handler: 'CacheFirst',
            options: { cacheName: 'static-assets', expiration: { maxEntries: 100 } }
          },
          {
            // API calls to your Django host
            urlPattern: /^https?:\/\/(192\.168\.100\.59|localhost|127\.0\.0\.1):8000\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 3 }
          }
        ]
      }
    })
  ]
})