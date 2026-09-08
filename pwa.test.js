import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base = new URL('./', import.meta.url);
const source = await readFile(new URL('sw.js', base),'utf8');
const assets = JSON.parse(source.match(/const ASSETS = (.*);/)[1]);
const integrity = JSON.parse(source.match(/const INTEGRITY = (.*);/)[1]);
test('Todos los recursos offline existen y coinciden con su huella', async()=>{
  for (const asset of assets) assert.equal(integrity[asset], 'sha256-' + createHash('sha256').update(await readFile(new URL(asset,base))).digest('base64'));
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest',base),'utf8'));
  for (const icon of manifest.icons) assert.ok(assets.includes(icon.src));
  assert.equal(manifest.display,'standalone');
});
function worker(fail = false) {
  const handlers = {}; const store = new Map([['unrelated',new Map()],['himnos-https://example.test/-old',new Map()]]);
  let skipped = false;
  const self = {registration:{scope:'https://example.test/'},clients:{claim:async()=>{}},skipWaiting:async()=>{skipped=true;},addEventListener:(type,fn)=>{handlers[type]=fn;}};
  const caches = {keys:async()=>[...store.keys()],delete:async k=>store.delete(k),open:async k=>{
    if (!store.has(k)) store.set(k,new Map()); const data=store.get(k);
    return {addAll:async requests=>{if(fail)throw Error('Download failed');for(const r of requests)data.set(r.url,{cached:r.url});},match:async key=>data.get(key)};
  }};
  vm.runInNewContext(source,{self,caches,URL,Request,fetch:()=>{throw Error('Network unavailable');}});
  async function event(type,data={}) {let pending;handlers[type]({...data,waitUntil:p=>{pending=p;},respondWith:p=>{pending=p;}});return await pending;}
  return {event,store,get skipped(){return skipped;}};
}
test('Una descarga fallida conserva la versión anterior',async()=>{const w=worker(true);await assert.rejects(w.event('install'));assert.ok(w.store.has('himnos-https://example.test/-old'));assert.equal(w.skipped,false);});
test('Navegación y datos responden desde caché sin red',async()=>{const w=worker();await w.event('install');await w.event('activate');for(const [mode,url] of [['navigate','https://example.test/'],['cors','https://example.test/datos.js']])assert.ok((await w.event('fetch',{request:{method:'GET',mode,url}})).cached);assert.ok(w.store.has('unrelated'));assert.equal(w.store.has('himnos-https://example.test/-old'),false);});
test('La actualización solo se activa al recibir la acción correspondiente',async()=>{const w=worker();await w.event('install');assert.equal(w.skipped,false);await w.event('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(w.skipped,true);});
