// Generated as sw.js by preparar-pwa.mjs. The cache version depends on every app asset.
const VERSION = '12f7aa2d781c1f5e';
const ASSETS = ["index.html","estilos.css","app.js","datos.js","categorias.js","almacen.js","busqueda.js","pwa.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-icon.png"];
const INTEGRITY = {"index.html":"sha256-LLxpAzoUkwoCChOWmR+itUu2FWvdaxRp9Bc0mfYQSkk=","estilos.css":"sha256-+sT1l6eIDARLF1QSEhLLerxUHdvX1R16FpLgxJSG3UE=","app.js":"sha256-6tXAglFIhoikUN65iczkZOf8WbhL08KgZC6l2R6Fqrk=","datos.js":"sha256-k7n8yE/cp/+9G8iPLmZC3EiAuLZS5BECJURU58g7MtM=","categorias.js":"sha256-cCZEbYoSzUzYZb6uvbml1oPfP5EoWNHGr5yc+7PWTJo=","almacen.js":"sha256-C7ztzztxj9pFPD96d67kC7y4NXgVWvDppTtao3xljOQ=","busqueda.js":"sha256-V9cjALMXHX7O0JRyGvLTDt1FKkX+eOx+rtE42poy2Yg=","pwa.js":"sha256-UurDxc8/lozdX5Y8ik63ABwxIJ0kvIHMSPs1YmNubk0=","manifest.webmanifest":"sha256-l1HcuR9sWrt2sdtuC8qmLr9stBKGC2apUvSh8vtrAS0=","icons/icon-192.png":"sha256-XcxGG+A3mJ3+SzaG/IUfwXOYontVYta6kLBjeu5bXJI=","icons/icon-512.png":"sha256-lATTiQs6+y4ui3odS78vtHwEfb41aVxvoEWZwhEhVAI=","icons/maskable-512.png":"sha256-lATTiQs6+y4ui3odS78vtHwEfb41aVxvoEWZwhEhVAI=","icons/apple-touch-icon.png":"sha256-IGjG1STuiEGPk3ZbbjbGHyXiRw7mkohzZKpkYoIgzHY="};
const PREFIX = 'himnos-' + self.registration.scope + '-';
const CACHE = PREFIX + VERSION;
const url = path => new URL(path, self.registration.scope).href;
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(ASSETS.map(path => new Request(url(path), {cache:'reload', integrity:INTEGRITY[path]})));
}
self.addEventListener('install', event => {
  // A failed download must never replace the working version.
  event.waitUntil(precache());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const target = request.mode === 'navigate' ? url('index.html') : request.url;
  if (request.mode !== 'navigate' && !ASSETS.some(path => url(path) === target)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(target);
    return cached || fetch(request);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'CACHE_STATUS') event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const results = await Promise.all(ASSETS.map(path => cache.match(url(path))));
    event.ports[0]?.postMessage({type:'CACHE_STATUS', ready:results.every(Boolean), version:VERSION});
  })());
  if (event.data?.type === 'REPAIR_CACHE') event.waitUntil((async () => {
    try { await precache(); event.ports[0]?.postMessage({ok:true}); }
    catch { event.ports[0]?.postMessage({ok:false}); }
  })());
});
