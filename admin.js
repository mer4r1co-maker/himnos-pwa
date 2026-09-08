import {textoCompleto,separarLetra} from './editar-letra.js';
import {himnos,categorias,version,api,sincronizar,recibir} from './catalogo-remoto.js';
import {validarEdicion} from './catalogo-modelo.js';
export async function administracion(app){
 const e=(tag,text,clase)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(clase)n.className=clase;return n;};
 const head=e('div','','admin-heading');head.append(e('span','⚙','admin-emblem'),e('h1','Administración','page-title'));app.append(head,e('p','Gestiona los himnos del catálogo','admin-subtitle'));
 const area=e('div');app.append(area);
 const aviso=e('p','','category-notice');aviso.setAttribute('role','status');app.append(aviso);
 const boton=(text,fn)=>{const b=e('button',text,'control');b.type='button';b.onclick=fn;return b;};
 async function intentar(fn){aviso.textContent='';try{await fn();}catch(error){aviso.textContent=error.message;}}
 function login(){area.replaceChildren();const form=e('form');const label=e('label','Contraseña de administrador','admin-label');const input=e('input');input.type='password';input.autocomplete='current-password';input.required=true;label.append(input);const submit=e('button','Entrar','control');submit.type='submit';form.append(label,submit);form.onsubmit=event=>{event.preventDefault();intentar(async()=>{submit.disabled=true;try{await api('login',{password:input.value});input.value='';await panel();}finally{submit.disabled=false;}});};area.append(form);}
 async function panel(){
  await sincronizar();area.replaceChildren();
  const select=e('select');select.setAttribute('aria-label','Himno seleccionado');
  for(const h of [...himnos].sort((a,b)=>a.titulo.localeCompare(b.titulo,'es'))){const o=e('option',`${h.numero} — ${h.titulo.replace(/\.+$/, '')}`);o.value=h.id;select.append(o);}
  const seleccionado=()=>himnos.find(h=>h.id===select.value);
  function tarjeta(icon,title,detail,action,clase=''){const button=boton('',action);button.className='admin-action '+clase;button.append(e('span',icon,'admin-action-icon'),e('strong',title),e('small',detail));return button;}
  const actions=e('div','','admin-actions');
  const edit=tarjeta('✎','Editar himno','Modificar letra y datos',()=>editar(seleccionado()));edit.disabled=!himnos.length;
  actions.append(tarjeta('+','Agregar himno','Nuevo himno al catálogo',()=>editar(),'primary'),edit,tarjeta('↪','Cerrar sesión','Salir de tu cuenta',()=>intentar(async()=>{await api('logout',{});login();}),'logout'));area.append(actions);
  const selected=e('section','','admin-selected');const label=e('label','Himno seleccionado','admin-label');label.append(select);selected.append(label);const card=e('div','','admin-hymn-card');selected.append(card);area.append(selected);
  function mostrar(){const h=seleccionado();card.replaceChildren();if(!h){card.append(e('p','Todavía no hay himnos.'));return;}
   const cover=e('div','','admin-cover');cover.append(e('span','♫'),e('strong',String(h.numero)));
   const details=e('div','','admin-hymn-details');details.append(e('h2',h.titulo.replace(/\.+$/, '')));
   const credits=h.creditosOriginales||'';const autor=h.autor??credits.split(/\b(?:Vol\.|Tono\b)/i)[0].trim();const tono=h.tono??credits.match(/\bTono\s*[.:]?\s*(.*)$/i)?.[1]?.trim();
   const asuntos=categorias.filter(c=>c.entradas.some(x=>x.numero===h.numero)).map(c=>c.nombreOriginal[0]+c.nombreOriginal.slice(1).toLowerCase()).join(', ');
   details.append(e('p','Autor / intérprete: '+(autor||'Sin registro')),e('p','Tono: '+(tono||'Sin registro')),e('p','Asunto: '+(asuntos||'Sin registro')));
   const view=e('a','Ver himno ›','control');view.href=`#himno/${h.numero}`;card.append(cover,details,view);
  }
  select.addEventListener('change',mostrar);mostrar();
  area.append(e('h2','Acciones rápidas','admin-quick-title'));const quick=e('div','','admin-quick');
  const category=tarjeta('▦','Cambiar asunto','Editar categorías',()=>{editar(seleccionado());area.querySelector('fieldset')?.scrollIntoView({block:'center',behavior:'smooth'});});category.disabled=!himnos.length;
  const remove=tarjeta('×','Eliminar himno','Quitar del catálogo',()=>{const h=seleccionado();if(h&&confirm(`¿Eliminar el himno ${h.numero}: ${h.titulo} para todos los usuarios?`))intentar(async()=>{await recibir(await api('catalogo',{accion:'eliminar',version,id:h.id}));await panel();aviso.textContent='Himno eliminado.';});},'logout');remove.disabled=!himnos.length;
  quick.append(category,remove);area.append(quick);
 }
 function editar(original){
  area.replaceChildren();const h=original?structuredClone(original):{id:'admin-'+crypto.randomUUID(),contenido:[],creditosOriginales:''};const form=e('form');form.className='admin-form';area.append(form);const inputs={};
  function campo(key,title,value='',multiline=false){const label=e('label',title,'admin-label');const input=e(multiline?'textarea':'input');input.value=value;inputs[key]=input;label.append(input);form.append(label);return input;}
  const numero=campo('numero','Número automático',h.numero||Math.max(0,...himnos.map(x=>x.numero))+1);numero.type='number';numero.readOnly=true;const titulo=campo('titulo','Título',h.titulo||'');titulo.required=true;titulo.maxLength=250;
  const groups=e('fieldset','');groups.append(e('legend','Categoría / asunto'));const elegidos=h.asuntos||categorias.filter(c=>c.entradas.some(x=>x.numero===h.numero)).map(c=>c.id);const checks=[];
  for(const c of categorias){const label=e('label',c.nombreOriginal,'admin-category');const input=e('input');input.type='checkbox';input.value=c.id;input.checked=elegidos.includes(c.id);checks.push(input);label.prepend(input);groups.append(label);}form.append(groups);
  const textoInicial=textoCompleto(h.contenido);
  const letra=campo('letra','Letra completa',textoInicial,true);letra.rows=18;
  form.append(e('p','Pega la letra completa. Deja una línea vacía entre estrofas y escribe Coro en una línea aparte antes de cada coro. Se conservarán las palabras, los saltos de verso y las repeticiones.','sample-note'));
  campo('autor','Autor / intérprete (opcional)',h.autor??h.creditosOriginales?.split(/\b(?:Vol\.|Tono\b)/i)[0]?.trim()??'');campo('tono','Tono (opcional)',h.tono??h.creditosOriginales?.match(/\bTono\s*[.:]?\s*(.*)$/i)?.[1]?.trim()??'');campo('informacionAdicional','Información adicional (opcional)',h.informacionAdicional||'',true);
  let draft;const preview=e('div');const save=boton('Guardar para todos',()=>intentar(async()=>{save.disabled=true;try{await recibir(await api('catalogo',{accion:'guardar',version,himno:draft}));await panel();aviso.textContent='Himno publicado para todos.';}finally{save.disabled=!draft;}}));save.disabled=true;
  form.addEventListener('input',()=>{draft=null;save.disabled=true;preview.replaceChildren();});
  const pre=boton('Vista previa',()=>intentar(async()=>{
   draft=validarEdicion({...h,numero:Number(numero.value),titulo:titulo.value,asuntos:checks.filter(c=>c.checked).map(c=>c.value),contenido:original&&letra.value===textoInicial?h.contenido:separarLetra(letra.value),autor:inputs.autor.value,tono:inputs.tono.value,informacionAdicional:inputs.informacionAdicional.value,revisionPendiente:false});
   delete draft.referenciaBiblica;
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

