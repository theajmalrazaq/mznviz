const CACHE_NAME = 'meezan-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Catch and log errors if any file fails to cache
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.warn('Failed to cache:', url, err));
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
