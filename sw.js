const CACHE_NAME = "recettes-famille-v2-2-manual-basket";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./qrcode.min.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(ASSETS);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(fetch(event.request).then(function (response) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(function (cache) {
      cache.put(event.request, copy);
    });
    return response;
  }).catch(function () {
    return caches.match(event.request).then(function (cached) {
      return cached || caches.match("./index.html");
    });
  }));
});
