import { himnos } from './catalogo-remoto.js';
const status = document.querySelector('#offline-status');
const retry = document.querySelector('#offline-retry');
const update = document.querySelector('#update-app');
const install = document.querySelector('#install-app');
let registration;
let installPrompt;
let controlled = Boolean(navigator.serviceWorker?.controller);
let reloading = false;
function showUpdate() { update.hidden = !registration?.waiting; }
async function checkCache() {
  const worker = navigator.serviceWorker?.controller;
  if (!worker) return;
  const channel = new MessageChannel();
  const timer = setTimeout(() => {
    status.textContent = 'No pudimos confirmar la descarga sin conexión.'; retry.hidden = false;
    channel.port1.close();
  }, 6000);
  channel.port1.onmessage = ({data}) => {
    clearTimeout(timer); channel.port1.close(); showUpdate();
    if (data?.type !== 'CACHE_STATUS') return;
    status.textContent = data.ready ? `${himnos.length} himnos listos para usar sin conexión.` : 'La descarga está incompleta. Conéctate y toca Reintentar.';
    retry.hidden = data.ready;
  };
  worker.postMessage({type:'CACHE_STATUS'}, [channel.port2]);
}
async function register() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.textContent = 'El uso sin conexión no está disponible en este navegador o dirección.'; return;
  }
  try {
    registration = await navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'});
    showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') showUpdate();
        if (worker.state === 'redundant') {
          if (!navigator.serviceWorker.controller) status.textContent = 'No se completó la descarga. Conéctate y toca Reintentar.';
          retry.hidden = false;
        }
      });
    });
    if (navigator.serviceWorker.controller) await checkCache();
  } catch {
    if (navigator.serviceWorker.controller) await checkCache();
    else { status.textContent = 'No se completó la descarga. Conéctate y toca Reintentar.'; retry.hidden = false; }
  }
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled && !reloading) { reloading = true; location.reload(); return; }
    controlled = true; showUpdate(); checkCache();
  });
}
retry.addEventListener('click', async () => {
  retry.disabled = true;
  status.textContent = 'Comprobando la descarga…';
  try {
    if (navigator.serviceWorker.controller) {
      // Repair only from an explicit user action; normal searches never use the network.
      const channel = new MessageChannel();
      await new Promise((resolve) => {
        const timer = setTimeout(() => { channel.port1.close(); resolve(); }, 15000);
        channel.port1.onmessage = () => { clearTimeout(timer); channel.port1.close(); resolve(); };
        navigator.serviceWorker.controller.postMessage({type:'REPAIR_CACHE'}, [channel.port2]);
      });
      await registration?.update().catch(() => {});
      showUpdate(); await checkCache();
    } else await register();
  } finally { retry.disabled = false; }
});
update.addEventListener('click', () => {
  if (registration?.waiting) { update.disabled = true; update.textContent = 'Actualizando…'; registration.waiting.postMessage({type:'ACTIVATE_UPDATE'}); }
});
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; install.hidden = false; });
install.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt(); await installPrompt.userChoice;
  installPrompt = undefined; install.hidden = true;
});
window.addEventListener('appinstalled', () => { install.hidden = true; });
window.addEventListener('online', checkCache);
register();

