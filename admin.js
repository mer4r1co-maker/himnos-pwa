import {himnos,categorias,version,api,sincronizar,recibir} from './catalogo-remoto.js';
import {validarEdicion} from './catalogo-modelo.js';
export async function administracion(app){
 const e=(tag,text,clase)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(clase)n.className=clase;return n;};
 app.append(e('h1','Administración','page-title'));
 const area=e('div');app.append(area);
 const aviso=e('p','','category-notice');aviso.setAttribute('role','status');app.append(aviso);
 const boton=(text,fn)=>{const b=e('button',text,'control');b.type='button';b.onclick=fn;return b;};
 async function intentar(fn){aviso.textContent='';try{await fn();}catch(error){aviso.textContent=error.message;}}
 function login(){area.replaceChildren();const form=e('form');const label=e('label','Contraseña de administrador','admin-label');const input=e('input');input.type='password';input.autocomplete='current-password';input.required=true;label.append(input);const submit=e('button','Entrar','control');submit.type='submit';form.append(label,submit);form.onsubmit=event=>{event.preventDefault();intentar(async()=>{submit.disabled=true;try{await api('login',{password:input.value});input.value='';await panel();}finally{submit.disabled=false;}});};area.append(form);}
 async function panel(){await sincronizar();area.replaceChildren();area.append(boton('Agregar himno',()=>editar()),boton('Cerrar sesión',()=>intentar(async()=>{await api('logout',{});login();})));
 const select=e('select');select.setAttribute('aria-label','Himno para editar');for(const h of himnos){const o=e('option',`${h.numero} — ${h.titulo}`);o.value=h.id;select.append(o);}area.append(select,boton('Editar himno seleccionado',()=>editar(himnos.find(h=>h.id===select.value))));}
 function editar(original){
  area.replaceChildren();const h=original?structuredClone(original):{id:'admin-'+crypto.randomUUID(),contenido:[],creditosOriginales:''};const form=e('form');form.className='admin-form';area.append(form);const inputs={};
  function campo(key,title,value='',multiline=false){const label=e('label',title,'admin-label');const input=e(multiline?'textarea':'input');input.value=value;inputs[key]=input;label.append(input);form.append(label);return input;}
  const numero=campo('numero','Número',h.numero||'');numero.type='number';numero.min=1;numero.max=99999;numero.required=true;const titulo=campo('titulo','Título',h.titulo||'');titulo.required=true;titulo.maxLength=250;
  const groups=e('fieldset','');groups.append(e('legend','Categoría / asunto'));const elegidos=h.asuntos||categorias.filter(c=>c.entradas.some(x=>x.numero===h.numero)).map(c=>c.id);const checks=[];
  for(const c of categorias){const label=e('label',c.nombreOriginal,'admin-category');const input=e('input');input.type='checkbox';input.value=c.id;input.checked=elegidos.includes(c.id);checks.push(input);label.prepend(input);groups.append(label);}form.append(groups);
  const blocks=e('div');form.append(e('p','Cada bloque conserva sus saltos de línea. Puedes mover el coro o las estrofas antes de guardar.','sample-note'),blocks);const entries=[];
  function bloque(b={tipo:'estrofa',etiquetaOriginal:null,lineas:[{texto:''}]}){
   const row=e('fieldset');const tipo=e('select');tipo.setAttribute('aria-label','Tipo de bloque');for(const t of ['estrofa','coro','hablado','sinClasificar','indicacion']){const o=e('option',t);o.value=t;tipo.append(o);}tipo.value=b.tipo;
   const label=e('input');label.setAttribute('aria-label','Encabezado del bloque');label.placeholder='Encabezado (opcional)';label.value=b.etiquetaOriginal||'';
   const text=e('textarea');text.setAttribute('aria-label','Letra del bloque');text.value=b.lineas.map(l=>l.texto).join('\n');text.rows=6;
   const entry={row,tipo,label,text};entries.push(entry);row.append(tipo,label,text,boton('Subir',()=>{const i=entries.indexOf(entry);if(i>0){[entries[i-1],entries[i]]=[entries[i],entries[i-1]];blocks.replaceChildren(...entries.map(x=>x.row));}}),boton('Quitar bloque',()=>{entries.splice(entries.indexOf(entry),1);row.remove();}));blocks.append(row);
  }
  h.contenido.forEach(bloque);if(!h.contenido.length)bloque();form.append(boton('Agregar estrofa',()=>bloque()),boton('Agregar coro',()=>bloque({tipo:'coro',etiquetaOriginal:'Coro',lineas:[{texto:''}]})));
  campo('autor','Autor / intérprete (opcional)',h.autor??h.creditosOriginales?.split(/\b(?:Vol\.|Tono\b)/i)[0]?.trim()??'');campo('tono','Tono (opcional)',h.tono??h.creditosOriginales?.match(/\bTono\s*[.:]?\s*(.*)$/i)?.[1]?.trim()??'');campo('referenciaBiblica','Referencia bíblica (opcional)',h.referenciaBiblica||'');campo('informacionAdicional','Información adicional (opcional)',h.informacionAdicional||'',true);
  let draft;const preview=e('div');const save=boton('Guardar para todos',()=>intentar(async()=>{save.disabled=true;try{await recibir(await api('catalogo',{accion:'guardar',version,himno:draft}));await panel();aviso.textContent='Himno publicado para todos.';}finally{save.disabled=!draft;}}));save.disabled=true;
  form.addEventListener('input',()=>{draft=null;save.disabled=true;preview.replaceChildren();});
  const pre=boton('Vista previa',()=>intentar(async()=>{
   draft=validarEdicion({...h,numero:Number(numero.value),titulo:titulo.value,asuntos:checks.filter(c=>c.checked).map(c=>c.value),contenido:entries.map(x=>({tipo:x.tipo.value,etiquetaOriginal:x.label.value||null,lineas:x.text.value.split('\n').map(texto=>({texto}))})),autor:inputs.autor.value,tono:inputs.tono.value,referenciaBiblica:inputs.referenciaBiblica.value,informacionAdicional:inputs.informacionAdicional.value,revisionPendiente:false});
   if(himnos.some(x=>x.numero===draft.numero&&x.id!==draft.id))throw Error('Ya existe un himno con ese número.');
   preview.className='hymn-paper admin-preview';preview.replaceChildren(e('h2',draft.titulo,'reading-title'));const article=e('article','','letra');for(const b of draft.contenido){const section=e('section');section.append(e('h3',b.etiquetaOriginal||b.tipo,'etiqueta'),e('p',b.lineas.map(l=>l.texto).join('\n')));article.append(section);}preview.append(article);queueMicrotask(()=>{save.disabled=false;});
  }));form.append(pre,preview,save,boton('Volver',()=>intentar(panel)));
  // Invalidate previews when the block structure changes, as well as typing.
  form.addEventListener('click',event=>{if(event.target!==pre&&event.target!==save&&event.target.closest('button')){draft=null;save.disabled=true;}},true);
  if(original)form.append(boton('Eliminar himno',()=>{if(confirm(`¿Eliminar el himno ${h.numero}: ${h.titulo} para todos los usuarios?`))intentar(async()=>{await recibir(await api('catalogo',{accion:'eliminar',version,id:h.id}));await panel();aviso.textContent='Himno eliminado.';});}));
  form.onsubmit=event=>event.preventDefault();
 }
 await intentar(async()=>{try{await api('session');}catch{login();return;}await panel();});
}

