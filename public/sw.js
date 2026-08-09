var cacheName = "termux-ttyd-pwa-v7";

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== cacheName;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }));
  self.clients.claim();
});
