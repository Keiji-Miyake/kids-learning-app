const CACHE_NAME = 'kids-learnquest-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // 開発中はネットワーク優先で常に最新コードを取得
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
