// BetTracker PWA service worker
// Strategie: network-first pro API, cache-first pro statické soubory

const CACHE_NAME = 'bettracker-v1';
const STATIC_ASSETS = [
  '/logo.png',
  '/manifest.json',
  '/bookmakers/tipsport.jpg',
  '/bookmakers/fortuna.jpg',
  '/bookmakers/chance.jpg',
  '/bookmakers/betano.png',
  '/bookmakers/synot.png',
  '/bookmakers/kingsbet.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nikdy necacheuj Supabase (dynamická data) ani Next.js HMR
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Cache-first pro obrázky a statické věci
  if (request.destination === 'image' || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first pro vše ostatní (s fallbackem na cache)
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
