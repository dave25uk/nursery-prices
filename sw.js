const cacheName = 'old-forge-v1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './prices.csv' // Add this line!
];

// Install the service worker and cache files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Serve the app from cache when offline
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});
