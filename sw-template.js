// Generated as sw.js by preparar-pwa.mjs. The cache version depends on every app asset.
const VERSION = '__VERSION__';
const ASSETS = __ASSETS__;
const INTEGRITY = __INTEGRITY__;
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
