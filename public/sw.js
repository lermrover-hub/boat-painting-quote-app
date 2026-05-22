const CACHE_NAME = "boat-painting-quote-v2";
const BASE_URL = new URL(self.registration.scope).pathname;
const APP_SHELL = [
  BASE_URL,
  `${BASE_URL}index.html`,
  `${BASE_URL}manifest.webmanifest`,
  `${BASE_URL}icons/icon-192.svg`,
  `${BASE_URL}icons/icon-512.svg`
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(`${BASE_URL}index.html`)))
  );
});
