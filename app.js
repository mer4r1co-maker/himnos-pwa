import { himnos } from './datos.js';
import { categorias } from './categorias.js';
import { buscar, normalizar } from './busqueda.js';
import { cargar, guardar, abrirReciente, alternarFavorito } from './almacen.js';
let storage; try { storage = window.localStorage; } catch {}
let estado = cargar(storage);
const app = document.querySelector('#app');
const media = matchMedia('(prefers-color-scheme: dark)');
const consultas = new Map();
const posiciones = new Map();
let origen = '#';
const iconos = {
  inicio: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  catalogo: '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M5 17h15M9 7h7M9 11h5M3 6h2M3 10h2M3 14h2"/>',
  categorias: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  ajustes: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  buscar: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  estrella: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
  flecha: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
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
  a.append(elemento('span','numero',String(h.numero).padStart(3,'0')),elemento('span','titulo',h.tituloOriginal),icono('flecha'));
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
  encabezado(catalogo?'Todos los himnos':'Tu himnario, siempre cerca.',catalogo?'Encuentra cada canto por su nombre o número.':null,catalogo?'CATÁLOGO':'UN MOMENTO PARA CANTAR');
  const status=elemento('p','status');status.setAttribute('role','status');
  const lista=elemento('div','lista');
  const resumen=elemento('div','home-sections');
  const nota=elemento('p','sample-note','6 letras disponibles en esta muestra.');
  function resultados(q) {
    consultas.set(ruta,q); const mostrar=catalogo||q.trim().length>0;
    status.hidden=!mostrar;lista.hidden=!mostrar;resumen.hidden=mostrar;
    const encontrados=buscar(himnos,q);
    status.textContent=q?`${encontrados.length} ${encontrados.length===1?'resultado':'resultados'}`:'POR NÚMERO · 6 HIMNOS DISPONIBLES';
    lista.replaceChildren(...encontrados.map(h=>fila(h,ruta)));
    if(!encontrados.length)lista.append(elemento('p','empty','No encontramos ese himno entre las seis letras disponibles. Puedes consultar sus datos en Categorías.'));
  }
  for (const [titulo,ids,detalle,ico] of [['Recientes',estado.recientes,'Los últimos cantos que abras estarán aquí.','reloj'],['Favoritos',estado.favoritos,'Guarda los cantos que quieres tener a mano.','estrella']]) {
    const section=elemento('section','collection'); const head=elemento('div','section-head');
    const name=elemento('h2');name.append(icono(ico),document.createTextNode(titulo));head.append(name);
    const items=ids.map(id=>himnos.find(h=>h.id===id)).filter(Boolean);
    head.append(elemento('span','section-count',String(items.length).padStart(2,'0')));section.append(head);
    if(!items.length)section.append(elemento('p','empty',detalle));
    else {const list=elemento('div','lista compact');list.append(...items.map(h=>fila(h,ruta)));section.append(list);}
    resumen.append(section);
  }
  const categoryHeading=elemento('div','section-head');categoryHeading.append(elemento('h2','','Por categoría'));
  const todas=elemento('a','text-link','Ver todas');todas.href='#categorias';categoryHeading.append(todas);resumen.append(categoryHeading);
  resumen.append(enlaceCategoria(categorias.find(c=>c.id==='evangelismo'),true));
  app.append(buscador(consulta,resultados),status,lista,resumen,nota); resultados(consulta);
}
function verCategorias() {
  encabezado('Un canto para cada ocasión.','Explora los 37 asuntos del índice original.','CATEGORÍAS');
  const grid=elemento('div','category-grid'); const status=elemento('p','status'); status.setAttribute('role','status');
  function filtrar(q) {
    const visible=categorias.filter(c=>normalizar(c.nombreOriginal).includes(normalizar(q)));
    grid.replaceChildren(...visible.map(c=>enlaceCategoria(c,c.id==='evangelismo')));
    status.textContent=`${visible.length} ${visible.length===1?'categoría':'categorías'}`;
    if(!visible.length)grid.append(elemento('p','empty','No encontramos una categoría con ese nombre.'));
  }
  app.append(buscador('',filtrar,'Buscar una categoría'),status,grid);filtrar('');
}
function verCategoria(id) {
  const c=categorias.find(c=>c.id===id);
  const back=elemento('a','back');back.href='#categorias';back.append(icono('volver'),document.createTextNode('Categorías'));app.append(back);
  if(!c){encabezado('Categoría no encontrada');return;}
  const disponibles=c.entradas.filter(e=>e.estadoVinculo==='coincide' && himnos.some(h=>h.numero===e.numeroIndice)).length;
  encabezado(nombreCategoria(c),`${c.entradas.length} himnos en el índice · ${disponibles} ${disponibles===1?'letra disponible':'letras disponibles'}`,'ÍNDICE POR ASUNTOS');
  app.append(elemento('p','category-notice','La lista está completa. Las letras pendientes se incorporarán al ampliar el catálogo.'));
  const lista=elemento('div','lista'); const status=elemento('p','status');status.setAttribute('role','status');
  function filtrar(q) {
    const entradas=c.entradas.filter(e=>/^\d+$/.test(q.trim())?e.numeroIndice===Number(q):normalizar(e.tituloIndice).includes(normalizar(q)));
    status.textContent=`${entradas.length} ${entradas.length===1?'himno':'himnos'}`;lista.replaceChildren();
    for(const e of entradas){
      const h=e.estadoVinculo==='coincide' && himnos.find(h=>h.numero===e.numeroIndice);
      if(h)lista.append(fila(h,`#categoria/${c.id}`));
      else {
        const row=elemento('div','himno pending');const text=elemento('div','row-text');
        text.append(elemento('span','titulo',e.tituloIndice),elemento('span','pending-label',e.estadoVinculo==='revisar'?'Referencia por revisar':'Letra pendiente'));
        row.append(elemento('span','numero',String(e.numeroIndice).padStart(3,'0')),text);lista.append(row);
      }
    }
    if(!entradas.length)lista.append(elemento('p','empty','No encontramos ese himno en esta categoría.'));
  }
  app.append(buscador('',filtrar),status,lista);filtrar('');
}
function lectura(numero) {
  const h=himnos.find(h=>h.numero===numero);
  const tituloOrigen=origen.startsWith('#categoria/')?'Volver a la categoría':origen==='#catalogo'?'Volver al catálogo':'Volver al inicio';
  const volver=elemento('a','back');volver.href=origen;volver.append(icono('volver'),document.createTextNode(tituloOrigen));app.append(volver);
  if(!h){encabezado('Himno no disponible','Este himno no forma parte de la muestra.');return;}
  estado=abrirReciente(estado,h.id);persistir();
  app.append(elemento('p','eyebrow',`HIMNO ${String(h.numero).padStart(3,'0')}`),elemento('h1','reading-title',h.tituloOriginal));
  const tags=elemento('div','category-tags');
  for(const c of categorias.filter(c=>c.entradas.some(e=>e.estadoVinculo==='coincide'&&e.numeroIndice===h.numero))){const a=elemento('a','category-tag',nombreCategoria(c));a.href=`#categoria/${c.id}`;tags.append(a);}
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
  const article=elemento('article','letra');
  for(const bloque of h.contenido){const section=elemento('section',bloque.tipo);if(bloque.etiquetaOriginal)section.append(elemento('h2','etiqueta',bloque.etiquetaOriginal));section.append(elemento('p','',bloque.lineas.map(l=>l.texto).join('\n')));article.append(section);}
  app.append(article,elemento('p','creditos',h.creditosOriginales));
  const nav=elemento('nav','pager');nav.setAttribute('aria-label','Navegar por la muestra');const i=himnos.indexOf(h);
  for(const [otro,label]of[[himnos[i-1],'← Anterior'],[himnos[i+1],'Siguiente →']])if(otro){const a=elemento('a');a.href=`#himno/${otro.numero}`;a.append(elemento('span','pager-label',label),elemento('span','pager-number',`Himno ${String(otro.numero).padStart(3,'0')}`));nav.append(a);}
  app.append(nav);
}
function ajustes(){
  encabezado('A tu manera.','Elige cómo quieres leer tus himnos.','AJUSTES');
  for(const[campo,titulo,opciones]of[['tema','Apariencia',[['sistema','Usar la del sistema'],['claro','Claro'],['oscuro','Oscuro']]],['tamano','Tamaño de letra',[[0,'Pequeña'],[1,'Mediana'],[2,'Grande'],[3,'Muy grande']]]]){
    const field=elemento('fieldset','settings-group');field.append(elemento('legend','',titulo));
    for(const[valor,texto]of opciones){const label=elemento('label','setting-option');const radio=elemento('input');radio.type='radio';radio.name=campo;radio.value=String(valor);radio.checked=estado[campo]===valor;radio.addEventListener('change',()=>{estado[campo]=valor;persistir();});label.append(radio,elemento('span','',texto));field.append(label);}app.append(field);
  }
  app.append(elemento('p','letra preview-text','Vista previa del tamaño de letra.'),elemento('p','sample-note','Tus favoritos y ajustes se guardan en este navegador.'));
}
function render(){
  const ruta=location.hash||'#';const match=/^#himno\/(\d+)$/.exec(ruta);const cat=/^#categoria\/([a-z-]+)$/.exec(ruta);
  app.replaceChildren();document.body.classList.toggle('is-reading',Boolean(match));
  if(match)lectura(Number(match[1]));else if(cat)verCategoria(cat[1]);else if(ruta==='#categorias')verCategorias();else if(ruta==='#ajustes')ajustes();else inicio(ruta==='#catalogo');
  const nav=document.querySelector('.bottom-nav');nav.hidden=Boolean(match);
  const active=cat?'#categorias':ruta;
  for(const link of nav.querySelectorAll('a')){if(link.getAttribute('href')===active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  const heading=app.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});document.title=`${heading.textContent} · Himnos`;
  const posicion=!match&&posiciones.get(ruta);const focused=posicion&&app.querySelector(`a[href="#himno/${posicion.numero}"]`);
  if(focused){focused.focus({preventScroll:true});window.scrollTo(0,posicion.y);}else window.scrollTo(0,0);
}
for(const link of document.querySelectorAll('.bottom-nav a')){const label=link.textContent;link.replaceChildren(icono(link.dataset.icon),elemento('span','',label));}
media.addEventListener('change',apariencia);apariencia();addEventListener('hashchange',render);render();
