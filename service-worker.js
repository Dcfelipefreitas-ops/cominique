const CACHE = "teleprompter-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./ffmpeg.min.js"
];

// ===============================
// INSTALL
// ===============================
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

// ===============================
// ACTIVATE
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ===============================
// FETCH
// ===============================
self.addEventListener("fetch", event => {
  const req = event.request;

  // ❌ NÃO INTERCEPTAR:
  if (
    req.url.startsWith("blob:") ||
    req.url.includes("mediastream") ||
    req.destination === "video" ||
    req.destination === "audio"
  ) {
    return;
  }

  // ✅ CACHE FIRST PARA ASSETS
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});
