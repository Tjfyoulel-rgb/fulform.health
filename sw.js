// WordBridge ESL — Service Worker
// Caches the app on first load so it works completely offline after that

const CACHE = 'wordbridge-v1';
const ASSETS = [
  './',
  './index.html',
];

// Install: cache everything
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', e => {
  // Don't intercept API calls — let those go to network (or fail gracefully)
  if (e.request.url.includes('anthropic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache new successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          caches.open(CACHE).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
