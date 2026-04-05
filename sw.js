const cacheName = 'old-forge-v2'; // Changed version to v2 to force a refresh

self.addEventListener('install', e => {
  self.skipWaiting(); // Forces the new service worker to take over immediately
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // STRATEGY: Network First for the price list, Cache First for the app shell
  if (url.pathname.includes('prices.csv')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(cacheName).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // Fallback to cache if Wi-Fi is dead
    );
  } else {
    // Standard cache-first for the UI (keeps it fast)
    e.respondWith(
      caches.match(e.request).then(res => res || fetch(e.request))
    );
  }
});
