import {combinar} from './catalogo-modelo.js';
export let {himnos,categorias}=combinar();
export let version=0;
let cambios={};
const cacheName='himnos-catalogo-compartido-v1';
function aplicar(s){if(!s||!Number.isInteger(s.version)||!s.cambios||typeof s.cambios!=='object')throw Error('Catálogo remoto no válido.');version=s.version;cambios=s.cambios;({himnos,categorias}=combinar(cambios));}
export async function api(path,body){
 const r=await fetch('/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
 let s;try{s=await r.json();}catch{throw Error('Administración aún no está conectada al servidor compartido.');}
 if(!r.ok)throw Error(s.error||'No se pudo conectar.');return s;
}
export async function sincronizar(){const s=await api('catalogo');await recibir(s);}
export async function recibir(s){aplicar(s);try{await(await caches.open(cacheName)).put(new URL('catalogo-local',location.href).origin+'/catalogo-local',Response.json(s));}catch{document.querySelector('#aviso').textContent='Cambios publicados. Este navegador no pudo guardarlos para leer sin conexión.';}}
export async function iniciarCatalogo(){try{const r=await(await caches.open(cacheName)).match(location.origin+'/catalogo-local');if(r)aplicar(await r.json());}catch{} }
