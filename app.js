import { himnos, categorias, iniciarCatalogo, sincronizar } from './catalogo-remoto.js';
import { administracion } from './admin.js';
import { vecinos } from './navegacion.js';

import { buscar, normalizar } from './busqueda.js';
import { cargar, guardar, abrirReciente, alternarFavorito } from './almacen.js';
let storage; try { storage = window.localStorage; } catch {}
let estado = cargar(storage);
const app = document.querySelector('#app');
const media = matchMedia('(prefers-color-scheme: dark)');
const consultas = new Map();
const posiciones = new Map();
let origen = '#';
let modoBusqueda = 'titulo';
const iconos = {
  inicio: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  catalogo: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 17h15M9 7h7M9 11h5M3 6h2M3 10h2M3 14h2"/>',
  categorias: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  ajustes: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  buscar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  estrella: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  flecha: '<path d="m9 5 7 7-7 7"/>',
  volver: '<path d="M19 12H5m5-5-5 5 5 5"/>'
};
function elemento(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}
function icono(nombre) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('class','icon'); svg.setAttribute('aria-hidden','true');
  // Only fixed, local SVG paths are used here, never PDF or user text.
  svg.innerHTML = iconos[nombre] || iconos.flecha; return svg;
}
function nombreCategoria(c) { return c.nombreOriginal[0] + c.nombreOriginal.slice(1).toLocaleLowerCase('es'); }
function tituloVisible(h) { return h.titulo.replace(/\.+\s*$/, ''); }
function apariencia() {
  document.documentElement.dataset.tema = estado.tema === 'sistema' ? (media.matches ? 'oscuro' : 'claro') : estado.tema;
  document.documentElement.style.setProperty('--tamano-letra', [18,21,25,29][estado.tamano] + 'px');
  document.querySelector('meta[name=theme-color]').content = document.documentElement.dataset.tema === 'oscuro' ? '#101d2b' : '#f6f5f1';
}
function persistir() {
  document.querySelector('#aviso').textContent = guardar(storage,estado) ? '' : 'No se pudieron guardar los cambios. Se conservarán solo mientras esta página siga abierta.';
  apariencia();
}
function recordar(h, ruta) { origen = ruta; posiciones.set(ruta,{y:window.scrollY,numero:h.numero}); }
function fila(h, ruta) {
  const a = elemento('a','himno'); a.href = `#himno/${h.numero}`;
  a.append(elemento('span','numero',String(h.numero).padStart(3,'0')),elemento('span','titulo',tituloVisible(h)));
  if(estado.favoritos.includes(h.id)){const star=icono('estrella');star.classList.add('saved-star');a.append(star);}
  a.append(icono('flecha'));
  a.addEventListener('click',()=>recordar(h,ruta)); return a;
}
function buscador(valor, callback, placeholder = 'Buscar por nombre o número') {
  const box = elemento('div','search-box');
  const label = elemento('label','sr-only',placeholder); label.htmlFor = 'buscar';
  const input = elemento('input','search'); input.id='buscar'; input.type='search'; input.placeholder=placeholder; input.value=valor;
  input.autocomplete='off'; input.spellcheck=false;
  input.addEventListener('input',()=>callback(input.value)); box.append(label,icono('buscar'),input); return box;
}
function encabezado(titulo,subtitulo,eyebrow) {
  if (eyebrow) app.append(elemento('p','eyebrow',eyebrow));
  app.append(elemento('h1','page-title',titulo));
  if (subtitulo) app.append(elemento('p','page-intro',subtitulo));
}
function enlaceCategoria(c, destacada = false) {
  const a = elemento('a',destacada ? 'category-feature' : 'category-card'); a.href=`#categoria/${c.id}`;
  if (destacada) a.append(elemento('span','feature-kicker','EXPLORA POR TEMA'));
  a.append(elemento('span','category-title',nombreCategoria(c)),elemento('span','category-count',`${c.entradas.length} himnos`),icono('flecha')); return a;
}
function inicio(catalogo=false) {
  const ruta=catalogo?'#catalogo':'#'; const consulta=consultas.get(ruta)||'';
  let orden='numero';
  if(catalogo) {
    const hero=elemento('section','catalog-hero');hero.setAttribute('aria-label','Salmo 106:1');
    hero.append(elemento('blockquote','verse','Alabad a Jehová,\nporque él es bueno.'),elemento('p','verse-source','SALMO 106:1'));app.append(hero);
    const heading=elemento('div','catalog-heading');const text=elemento('div');text.append(elemento('h1','page-title','Catálogo'),elemento('p','page-intro','Explora todos los himnos'));
    const sort=elemento('select','catalog-sort');sort.setAttribute('aria-label','Ordenar catálogo');
    for(const [value,label] of [['numero','Número'],['titulo','Título A–Z']]){const option=elemento('option','',label);option.value=value;sort.append(option);}
    sort.addEventListener('change',()=>{orden=sort.value;resultados(consultas.get(ruta)||'');});heading.append(text,sort);app.append(heading);
  }
  else {
    app.append(elemento('h1','sr-only','Himnos'));
    const hero=elemento('section','home-hero');hero.setAttribute('aria-label','Versículo del día');
    hero.append(elemento('blockquote','verse','Alabad a Jehová,\nporque él es bueno;\nporque para siempre\nes su misericordia.'),elemento('p','verse-source','SALMO 106:1'));app.append(hero);
  }
  const status=elemento('p','status');status.setAttribute('role','status');
  const lista=elemento('div','lista');
  const resumen=elemento('div','home-sections');
  const nota=elemento('p','sample-note',`${himnos.length} himnos · Consulta local, sin conexión.`);
  function resultados(q) {
    consultas.set(ruta,q); const mostrar=catalogo||q.trim().length>0;
    status.hidden=!mostrar;lista.hidden=!mostrar;resumen.hidden=mostrar;
    const encontrados=[...buscar(himnos,q,modoBusqueda)];
    if(catalogo&&orden==='titulo'&&!q.trim())encontrados.sort((a,b)=>a.titulo.localeCompare(b.titulo,'es')||a.numero-b.numero);
    status.textContent=q?`${encontrados.length} ${encontrados.length===1?'resultado':'resultados'}`:`${catalogo&&orden==='titulo'?'POR TÍTULO':'POR NÚMERO'} · ${himnos.length} HIMNOS`;
    lista.replaceChildren(...encontrados.map(h=>{
      if(!catalogo)return fila(h,ruta);
      const row=elemento('div','catalog-row');const link=fila(h,ruta);link.querySelector('.saved-star')?.remove();
      const fav=elemento('button','catalog-favorite');fav.type='button';fav.append(icono('estrella'));
      function actualizar(){const saved=estado.favoritos.includes(h.id);fav.setAttribute('aria-pressed',String(saved));fav.setAttribute('aria-label',`${saved?'Quitar de':'Añadir a'} favoritos: ${tituloVisible(h)}`);}
      fav.addEventListener('click',()=>{estado=alternarFavorito(estado,h.id);persistir();actualizar();});actualizar();row.append(link,fav);return row;
    }));
    if(!encontrados.length)lista.append(elemento('p','empty',modoBusqueda==='letra'?'No encontramos coincidencias. Prueba con unas pocas palabras de la letra.':'No encontramos ese himno. Prueba con otro nombre o número.'));
  }
  for (const [titulo,ids,detalle,ico] of [['Favoritos',estado.favoritos,'Guarda los cantos que quieres tener a mano.','estrella'],['Recientes',estado.recientes,'Los últimos cantos que abras estarán aquí.','reloj']]) {
    const section=elemento('section','collection'); const head=elemento('div','section-head');
    const name=elemento('h2');name.append(icono(ico),document.createTextNode(titulo));head.append(name);
    const items=ids.map(id=>himnos.find(h=>h.id===id)).filter(Boolean);
    const all=elemento('a','text-link','Ver todos');all.href=titulo==='Favoritos'?'#favoritos':'#recientes';all.append(icono('flecha'));head.append(all);section.append(head);
    if(!items.length)section.append(elemento('p','empty',detalle));
    else {const list=elemento('div','lista compact');list.append(...items.slice(0,3).map(h=>fila(h,ruta)));section.append(list);}
    resumen.append(section);
  }
  const search=buscador(consulta,resultados);
  const filter=elemento('button','search-filter');filter.type='button';filter.setAttribute('aria-label','Tipo de búsqueda');filter.setAttribute('aria-haspopup','dialog');filter.append(icono('ajustes'));search.classList.add('with-filter');search.append(filter);
  const dialog=elemento('dialog','hymn-info');dialog.setAttribute('aria-labelledby','search-mode-title');const title=elemento('h2','','Tipo de búsqueda');title.id='search-mode-title';dialog.append(title);
  function actualizarModo(){const label=modoBusqueda==='letra'?'Buscar por parte de la letra':'Buscar por nombre o número';search.querySelector('input').placeholder=label;search.querySelector('label').textContent=label;filter.setAttribute('aria-label',`Tipo de búsqueda: ${label}`);}
  for(const [value,label]of[['titulo','Buscar por nombre o número'],['letra','Buscar por parte de la letra']]){
    const option=elemento('label','setting-option');const radio=elemento('input');radio.type='radio';radio.name='modo-busqueda';radio.value=value;radio.checked=modoBusqueda===value;
    radio.addEventListener('change',()=>{modoBusqueda=value;actualizarModo();resultados(search.querySelector('input').value);dialog.close();search.querySelector('input').focus();});option.append(radio,elemento('span','',label));dialog.append(option);
  }
  const close=elemento('button','control','Cerrar');close.type='button';close.addEventListener('click',()=>dialog.close());dialog.append(close);filter.addEventListener('click',()=>dialog.showModal());app.append(dialog);actualizarModo();
  app.append(search);
  {const chips=elemento('nav','category-chips');chips.setAttribute('aria-label','Categorías destacadas');const all=elemento('a','chip selected','Todos');all.href='#catalogo';chips.append(all);for(const id of ['alabanza','oracion','evangelismo','pascua']){const c=categorias.find(c=>c.id===id);if(c){const chip=elemento('a','chip',nombreCategoria(c));chip.href=`#categoria/${c.id}`;chips.append(chip);}}app.append(chips);}
  app.append(status,lista,resumen,nota); resultados(consulta);
}
function verGuardados(favoritos){
  const ruta=favoritos?'#favoritos':'#recientes';
  encabezado(favoritos?'Favoritos':'Recientes',favoritos?'Tus cantos, siempre a mano.':'Los últimos himnos que abriste.','TU HIMNARIO');
  const items=(favoritos?estado.favoritos:estado.recientes).map(id=>himnos.find(h=>h.id===id)).filter(Boolean);
  const list=elemento('div','lista');list.append(...items.map(h=>fila(h,ruta)));
  if(!items.length)list.append(elemento('p','empty',favoritos?'Todavía no has guardado favoritos.':'Los himnos que abras aparecerán aquí.'));app.append(list);
}
function verCategorias() {
  const hero=elemento('section','catalog-hero');hero.setAttribute('aria-label','Salmo 106:1');
  hero.append(elemento('blockquote','verse','Alabad a Jehová,\nporque él es bueno.'),elemento('p','verse-source','SALMO 106:1'));app.append(hero);
  const heading=elemento('div','catalog-heading');const text=elemento('div');text.append(elemento('h1','page-title','Categorías'),elemento('p','page-intro','Explora los himnos por tema'));heading.append(text);app.append(heading);
  const grid=elemento('div','category-grid'); const status=elemento('p','status'); status.setAttribute('role','status');
  function filtrar(q) {
    const visible=categorias.filter(c=>normalizar(c.nombreOriginal).includes(normalizar(q)));
    grid.replaceChildren(...visible.map(c=>enlaceCategoria(c)));
    status.textContent=`${visible.length} ${visible.length===1?'categoría':'categorías'}`;
    if(!visible.length)grid.append(elemento('p','empty','No encontramos una categoría con ese nombre.'));
  }
  app.append(buscador('',filtrar,'Buscar una categoría'),status,grid);filtrar('');
}
function verCategoria(id) {
  const c=categorias.find(c=>c.id===id);
  const back=elemento('a','back');back.href='#categorias';back.append(icono('volver'),document.createTextNode('Categorías'));app.append(back);
  if(!c){encabezado('Categoría no encontrada');return;}
  const disponibles=c.entradas.filter(e=>e.estadoVinculo!=='revisar' && himnos.some(h=>h.numero===e.numero)).length;
  encabezado(nombreCategoria(c),`${c.entradas.length} himnos en el índice · ${disponibles} ${disponibles===1?'letra disponible':'letras disponibles'}`,'ÍNDICE POR ASUNTOS');
  if (c.entradas.some(e=>e.estadoVinculo==='revisar')) app.append(elemento('p','category-notice','Las referencias con diferencias entre el índice y el himno están señaladas para revisión.'));
  const lista=elemento('div','lista'); const status=elemento('p','status');status.setAttribute('role','status');
  function filtrar(q) {
    const entradas=c.entradas.filter(e=>/^\d+$/.test(q.trim())?e.numero===Number(q):normalizar(e.tituloIndice).includes(normalizar(q)));
    status.textContent=`${entradas.length} ${entradas.length===1?'himno':'himnos'}`;lista.replaceChildren();
    for(const e of entradas){
      const h=e.estadoVinculo!=='revisar' && himnos.find(h=>h.numero===e.numero);
      if(h)lista.append(fila(h,`#categoria/${c.id}`));
      else {
        const row=elemento('div','himno pending');const text=elemento('div','row-text');
        text.append(elemento('span','titulo',e.tituloIndice),elemento('span','pending-label',e.estadoVinculo==='revisar'?'Referencia por revisar':'Letra pendiente'));
        row.append(elemento('span','numero',String(e.numero).padStart(3,'0')),text);lista.append(row);
      }
    }
    if(!entradas.length)lista.append(elemento('p','empty','No encontramos ese himno en esta categoría.'));
  }
  app.append(buscador('',filtrar),status,lista);filtrar('');
}
function lectura(numero) {
  const h=himnos.find(h=>h.numero===numero);
  const tituloOrigen=origen.startsWith('#categoria/')?'Volver a la categoría':origen==='#catalogo'?'Volver al catálogo':origen==='#favoritos'?'Volver a favoritos':origen==='#recientes'?'Volver a recientes':'Volver al inicio';
  const volver=elemento('a','back');volver.href=origen;volver.append(icono('volver'),document.createTextNode(tituloOrigen));app.append(volver);
  if(!h){encabezado('Himno no disponible','No encontramos este número en el catálogo.');return;}
  estado=abrirReciente(estado,h.id);persistir();
  app.append(elemento('p','eyebrow',`HIMNO ${String(h.numero).padStart(3,'0')}`),elemento('h1','reading-title',tituloVisible(h)));
  const tags=elemento('div','category-tags');
  for(const c of categorias.filter(c=>c.entradas.some(e=>e.estadoVinculo!=='revisar'&&e.numero===h.numero))){const a=elemento('a','category-tag',nombreCategoria(c));a.href=`#categoria/${c.id}`;tags.append(a);}
  app.append(tags);
  const controls=elemento('div','reader-controls');const fav=elemento('button','control favorite');fav.type='button';
  function favorito(){const activo=estado.favoritos.includes(h.id);fav.replaceChildren(icono('estrella'),document.createTextNode(activo?'Guardado':'Favorito'));fav.setAttribute('aria-pressed',String(activo));}
  fav.addEventListener('click',()=>{estado=alternarFavorito(estado,h.id);persistir();favorito();});favorito();controls.append(fav);
  const sizes=elemento('div','size-controls');const menos=elemento('button','control','A−');const mas=elemento('button','control','A+');
  menos.type=mas.type='button';menos.setAttribute('aria-label','Disminuir tamaño de letra');mas.setAttribute('aria-label','Aumentar tamaño de letra');
  const sizeStatus=elemento('span','sr-only');sizeStatus.setAttribute('role','status');
  function actualizarTamano(){menos.disabled=estado.tamano===0;mas.disabled=estado.tamano===3;sizeStatus.textContent=['Pequeña','Mediana','Grande','Muy grande'][estado.tamano];}
  for(const [button,delta]of[[menos,-1],[mas,1]])button.addEventListener('click',()=>{estado.tamano=Math.max(0,Math.min(3,estado.tamano+delta));persistir();actualizarTamano();});
  actualizarTamano();sizes.append(menos,mas,sizeStatus);controls.append(sizes);app.append(controls);
  if (h.revisionPendiente) {
    const note=elemento('details','source-review');note.append(elemento('summary','','Sobre esta transcripción'));
    note.append(elemento('p','',`Extraída del PDF, páginas ${h.paginasPdf.join(', ')}. Pendiente de cotejo visual completo.`));
    if (h.incidencias?.length) note.append(elemento('p','',h.incidencias.map(i=>i.detalle || (i.tipo==='palabraPartida'?'Se conserva una palabra partida por un salto de línea.':i.tipo)).filter((v,i,a)=>a.indexOf(v)===i).join(' ')));
    app.append(note);
  }
  const article=elemento('article','letra');
  for(const bloque of h.contenido){
    const section=elemento('section',bloque.tipo);
    let etiqueta=bloque.etiquetaOriginal;
    if(bloque.tipo==='estrofa')etiqueta=etiqueta ? (/^\d+\.?$/.test(etiqueta.trim())?`Estrofa ${etiqueta}`:etiqueta) : 'Estrofa';
    if(etiqueta)section.append(elemento('h2','etiqueta',etiqueta));
    section.append(elemento('p','',bloque.lineas.map(l=>l.texto).join('\n')));article.append(section);
  }
  app.append(article);
  const nav=elemento('nav','pager');nav.setAttribute('aria-label','Navegar entre himnos');const vecinosActuales=vecinos(himnos,categorias,h.numero,origen);
  for(const [otro,label]of[[vecinosActuales.anterior,'← Anterior'],[vecinosActuales.siguiente,'Siguiente →']])if(otro){const a=elemento('a');a.href=`#himno/${otro.numero}`;a.append(elemento('span','pager-label',label),elemento('span','pager-number',`Himno ${String(otro.numero).padStart(3,'0')}`));nav.append(a);}
  const paper=elemento('div','hymn-paper');
  paper.append(app.querySelector('.eyebrow'),app.querySelector('.reading-title'),sizes,article);
  controls.remove();app.append(paper);
  const dialog=elemento('dialog','hymn-info hymn-sheet');dialog.setAttribute('aria-labelledby','info-title');
  const close=elemento('button','control','Cerrar');close.type='button';close.addEventListener('click',()=>dialog.close());
  dialog.append(elemento('h2','','Información'));dialog.querySelector('h2').id='info-title';
  const dismiss=elemento('button','sheet-dismiss','×');dismiss.type='button';dismiss.setAttribute('aria-label','Cerrar información');dismiss.addEventListener('click',()=>dialog.close());dialog.append(dismiss);
  const credits=h.creditosOriginales?.trim()||'';
  const performer=h.autor ?? credits.split(/\b(?:Vol\.|Tono\b)/i)[0].trim();
  const tone=h.tono ?? credits.match(/\bTono\s*[.:]?\s*(.*)$/i)?.[1]?.trim();
  const asuntos=[...tags.querySelectorAll('a')].map(a=>a.textContent).join(', ');
  tags.remove();
  for(const [label,value,ico]of[['Título',tituloVisible(h),'catalogo'],['Intérprete / grupo',performer||'No tenemos registro.','estrella'],['Asunto',asuntos||'No tenemos registro.','categorias'],['Tono',tone&&/[a-záéíóú]/i.test(tone)?tone:'No tenemos registro.','ajustes']]){
    const row=elemento('section','info-row');const content=elemento('div');content.append(elemento('h3','',label),elemento('p','',value));row.append(icono(ico),content);dialog.append(row);
  }
  for(const [label,value]of[['Referencia bíblica',h.referenciaBiblica],['Información adicional',h.informacionAdicional]])if(value){const row=elemento('section','info-row');const content=elemento('div');content.append(elemento('h3','',label),elemento('p','',value));row.append(content);dialog.append(row);}
  const original=elemento('details','info-original');original.append(elemento('summary','','Créditos originales'),elemento('p','',credits||'No tenemos registro.'));dialog.append(original);
  const review=app.querySelector('.source-review');if(review)dialog.append(review);
  const report=elemento('a','control whatsapp-contact','Corrección u observación por WhatsApp');
  report.href=`https://wa.me/524981191652?text=${encodeURIComponent(`Hola, tengo una corrección u observación sobre el himno ${h.numero}: ${tituloVisible(h)}.\n\n`)}`;report.target='_blank';report.rel='noopener noreferrer';
  dialog.append(report,close);
  const info=elemento('button','reader-action','ⓘ');info.type='button';info.append(elemento('span','','Información'));info.addEventListener('click',()=>dialog.showModal());
  const share=elemento('button','reader-action','↗');share.type='button';share.append(elemento('span','','Compartir'));
  const shareStatus=elemento('p','sr-only');shareStatus.setAttribute('role','status');
  share.addEventListener('click',async()=>{const url=new URL(`#himno/${h.numero}`,location.href).href;try{if(navigator.share)await navigator.share({title:tituloVisible(h),url});else{await navigator.clipboard.writeText(url);shareStatus.textContent='Enlace copiado.';}}catch(error){if(error.name!=='AbortError'){shareStatus.className='share-message';shareStatus.textContent=`Puedes copiar este enlace: ${url}`;}}});
  const previous=nav.firstElementChild?.textContent.includes('Anterior')?nav.firstElementChild:null;
  const next=nav.lastElementChild?.textContent.includes('Siguiente')?nav.lastElementChild:null;
  nav.replaceChildren();
  for(const [link,label,symbol]of[[previous,'Anterior','←'],[next,'Siguiente','→']]){if(link){link.className='reader-action';link.replaceChildren(document.createTextNode(symbol),elemento('span','',label));} }
  fav.classList.add('reader-action');
  nav.append(...(previous?[previous]:[]),fav,info,share,...(next?[next]:[]));
  app.append(nav,dialog,shareStatus);
}
function ajustes(){
  const adminLink=elemento('a','control','Administración');adminLink.href='#administracion';app.append(adminLink);
  encabezado('A tu manera.','Elige cómo quieres leer tus himnos.','AJUSTES');
  for(const[campo,titulo,opciones]of[['tema','Apariencia',[['sistema','Usar la del sistema'],['claro','Claro'],['oscuro','Oscuro']]],['tamano','Tamaño de letra',[[0,'Pequeña'],[1,'Mediana'],[2,'Grande'],[3,'Muy grande']]]]){
    const field=elemento('fieldset','settings-group');field.append(elemento('legend','',titulo));
    for(const[valor,texto]of opciones){const label=elemento('label','setting-option');const radio=elemento('input');radio.type='radio';radio.name=campo;radio.value=String(valor);radio.checked=estado[campo]===valor;radio.addEventListener('change',()=>{estado[campo]=valor;persistir();});label.append(radio,elemento('span','',texto));field.append(label);}app.append(field);
  }
  app.append(elemento('p','letra preview-text','Vista previa del tamaño de letra.'),elemento('p','sample-note','Tus favoritos y ajustes se guardan en este navegador.'));
}
function render(){
  document.querySelector('.badge').textContent=himnos.length+' himnos';
  document.querySelector('footer>p:last-child').textContent=himnos.length+' himnos · '+categorias.length+' categorías';
  const ruta=location.hash||'#';const match=/^#himno\/(\d+)$/.exec(ruta);const cat=/^#categoria\/([a-z-]+)$/.exec(ruta);
  app.replaceChildren();document.body.classList.toggle('is-reading',Boolean(match));
  document.body.classList.toggle('is-home',ruta==='#');
  document.body.classList.toggle('is-catalog',ruta==='#catalogo');
  document.body.classList.toggle('is-categories',ruta==='#categorias');
  if(match)lectura(Number(match[1]));else if(cat)verCategoria(cat[1]);else if(ruta==='#favoritos'||ruta==='#recientes')verGuardados(ruta==='#favoritos');else if(ruta==='#categorias')verCategorias();else if(ruta==='#ajustes')ajustes();else if(ruta==='#administracion')administracion(app);else inicio(ruta==='#catalogo');
  const nav=document.querySelector('.bottom-nav');nav.hidden=Boolean(match);
  const active=cat?'#categorias':['#favoritos','#recientes'].includes(ruta)?'#':ruta;
  for(const link of nav.querySelectorAll('a')){if(link.getAttribute('href')===active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  const heading=app.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});document.title=`${heading.textContent} · Himnos`;
  const posicion=!match&&posiciones.get(ruta);const focused=posicion&&app.querySelector(`a[href="#himno/${posicion.numero}"]`);
  if(focused){focused.focus({preventScroll:true});window.scrollTo(0,posicion.y);}else window.scrollTo(0,0);
}
for(const link of document.querySelectorAll('.bottom-nav a')){const label=link.textContent;link.replaceChildren(icono(link.dataset.icon),elemento('span','',label));}
await iniciarCatalogo();
media.addEventListener('change',apariencia);apariencia();addEventListener('hashchange',render);render();
async function refrescarCatalogo(){if(location.hash==='#administracion')return;try{await sincronizar();if(location.hash!=='#administracion'&&!location.hash.startsWith('#himno/'))render();}catch{}}
refrescarCatalogo();addEventListener('online',refrescarCatalogo);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refrescarCatalogo();});




