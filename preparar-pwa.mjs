import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const assets = ['assets/paisaje.webp','index.html','estilos.css','app.js','admin.js','catalogo-modelo.js','catalogo-remoto.js','navegacion.js','datos.js','categorias.js','almacen.js','busqueda.js','pwa.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'];
const base = new URL('./',import.meta.url);
const template = await readFile(new URL('sw-template.js',base),'utf8');
const hash = createHash('sha256').update(template);
const integrity = {};
for (const asset of assets) {
  const bytes = await readFile(new URL(asset,base));
  hash.update(asset).update(bytes);
  integrity[asset] = 'sha256-' + createHash('sha256').update(bytes).digest('base64');
}
const version = hash.digest('hex').slice(0,16);
await writeFile(new URL('sw.js',base),template.replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify(assets)).replace('__INTEGRITY__',JSON.stringify(integrity)));
console.log(`PWA ${version}: ${assets.length} recursos incluidos.`);



const destination=new URL('../publicacion/',base);
for(const asset of [...assets,'sw.js']){const target=new URL(asset,destination);await mkdir(new URL('./',target),{recursive:true});await copyFile(new URL(asset,base),target);}

