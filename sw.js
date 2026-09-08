// Generated as sw.js by preparar-pwa.mjs. The cache version depends on every app asset.
const VERSION = '4468087689f002d3';
const ASSETS = ["index.html","estilos.css","app.js","datos.js","categorias.js","almacen.js","busqueda.js","pwa.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","icons/apple-touch-icon.png"];
const INTEGRITY = {"index.html":"sha256-YIMbkQbfpu5mu5lcrmvjsa9a3Sge51i10OYKpmL2NUc=","estilos.css":"sha256-lOeWHs7zIS9uAtLN640EZZebDToPYi3eeQJV+k02k4w=","app.js":"sha256-xL6nv6IAdsvCt87A2HAY3PYfFMa/YKPUD29X3PrK06Y=","datos.js":"sha256-2DdPOSBpaJ/lE0YZW2ErM/d8Vitoji96rbod50KScg4=","categorias.js":"sha256-iqUTj9UNlq0JxpMJnThvpvDES5jU8ogSHN1I25w5zZA=","almacen.js":"sha256-C7ztzztxj9pFPD96d67kC7y4NXgVWvDppTtao3xljOQ=","busqueda.js":"sha256-JP1q+CLfeG9EzX9fbvHHE4nxicvkUiBc6Vu2aTMc2YQ=","pwa.js":"sha256-kwr2gm0375EXpon6qSFnQCA2/uuzi1ZZ4mcmbEGcc4o=","manifest.webmanifest":"sha256-DyaR11kEzNBy8Icob8NG2ykz9rqX1jLE7dpbeERNAEE=","icons/icon-192.png":"sha256-XcxGG+A3mJ3+SzaG/IUfwXOYontVYta6kLBjeu5bXJI=","icons/icon-512.png":"sha256-lATTiQs6+y4ui3odS78vtHwEfb41aVxvoEWZwhEhVAI=","icons/maskable-512.png":"sha256-lATTiQs6+y4ui3odS78vtHwEfb41aVxvoEWZwhEhVAI=","icons/apple-touch-icon.png":"sha256-IGjG1STuiEGPk3ZbbjbGHyXiRw7mkohzZKpkYoIgzHY="};
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
