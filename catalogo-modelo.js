import { himnos as base } from './datos.js';
import { categorias as asuntos } from './categorias.js';
export function combinar(cambios={}) {
 const mapa=new Map(base.map(h=>[h.id,h]));
 for(const [id,h] of Object.entries(cambios)){if(h===null)mapa.delete(id);else mapa.set(id,h);}
 const himnos=[...mapa.values()].sort((a,b)=>a.numero-b.numero);
 const categorias=asuntos.map(c=>({...c,entradas:c.entradas.filter(e=>!Object.hasOwn(cambios,base.find(h=>h.numero===e.numero)?.id||'')).map(e=>({...e}))}));
 for(const h of Object.values(cambios).filter(Boolean))for(const id of h.asuntos||[]){const c=categorias.find(c=>c.id===id);if(c)c.entradas.push({numero:h.numero,numeroIndice:h.numero,tituloIndice:h.titulo,estadoVinculo:'autorizado'});}
 return {himnos,categorias};
}
export function validarEdicion(h){
 if(!h||typeof h.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(h.id)||!Number.isSafeInteger(h.numero)||h.numero<1||h.numero>99999)throw Error('Número no válido.');
 if(typeof h.titulo!=='string'||!h.titulo.trim()||h.titulo.length>250)throw Error('Escribe un título.');
 if(!Array.isArray(h.asuntos)||!h.asuntos.length||h.asuntos.some(id=>!asuntos.some(c=>c.id===id)))throw Error('Selecciona un asunto.');
 if(!Array.isArray(h.contenido)||!h.contenido.length||h.contenido.length>150)throw Error('Agrega la letra.');
 for(const b of h.contenido){if(!['estrofa','coro','hablado','sinClasificar','indicacion'].includes(b.tipo)||!(b.etiquetaOriginal==null||typeof b.etiquetaOriginal==='string')||!Array.isArray(b.lineas)||!b.lineas.length||b.lineas.some(l=>typeof l.texto!=='string'))throw Error('Bloque de letra no válido.');}
 if(!h.contenido.some(b=>b.lineas.some(l=>l.texto.trim())))throw Error('Agrega la letra.');
 for(const k of ['autor','tono','referenciaBiblica','informacionAdicional','creditosOriginales'])if(h[k]!=null&&(typeof h[k]!=='string'||h[k].length>10000))throw Error('Información demasiado extensa.');
 if(JSON.stringify(h).length>100000)throw Error('El himno es demasiado largo.');
 return h;
}
