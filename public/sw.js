const CACHE_NAME = "nexalgotrix-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-180.png",
  "/favicon.ico",
  "/favicon.png",
  "/manifest.json",
  "/robots.txt"
];

// Install Service Worker and cache assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate SW and clean old caches
self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

// Fetch from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return cachedRes || fetch(event.request);
    })
  );
});
