const CACHE_NAME = 'jinsplanner-v20';

const ASSETS = [
  '/jinsplanner/',
  '/jinsplanner/index.html',
  '/jinsplanner/manifest.json',
  '/jinsplanner/icons/icon-192.png',
  '/jinsplanner/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;

  const isHTML = e.request.destination === 'document';
  if (isHTML) {
    // HTML은 항상 최신 버전을 우선 (redirect 후 구버전 캐시 노출 방지)
    // 네트워크 실패 또는 non-200 응답 모두 캐시로 폴백
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        }
        return caches.match('/jinsplanner/index.html');
      }).catch(() => caches.match('/jinsplanner/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        return response;
      }).catch(() => caches.match('/jinsplanner/index.html'));
    })
  );
});
