import test from 'node:test';
import assert from 'node:assert/strict';
import { buscar } from './busqueda.js';
import { himnos } from './datos.js';
test('Los números corregidos identifican himnos distintos',()=>{assert.equal(buscar(himnos,'335')[0].tituloOriginal,'YO ESTOY CONTIGO.');assert.equal(buscar(himnos,'236')[0].tituloOriginal,'NO TARDES MÁS.');assert.equal(buscar(himnos,'336')[0].tituloOriginal,'YO LE VERÉ.');});
test('Busca número exacto y admite ceros iniciales',()=>{assert.equal(buscar(himnos,'001')[0].numero,1);assert.equal(buscar(himnos,'2').length,1);});
test('No pierde títulos repetidos y omite acentos al buscar',()=>{assert.deepEqual(buscar(himnos,'aumentame fe').map(h=>h.numero),[21,22]);});
test('Una búsqueda sin coincidencias devuelve lista vacía',()=>{assert.deepEqual(buscar(himnos,'zzzz'),[]);});
import { cargar, guardar, abrirReciente, alternarFavorito, validar } from './almacen.js';
const memoria = () => { let value = null; return {getItem:()=>value,setItem:(k,v)=>{value=v;}}; };
test('Favoritos y preferencias sobreviven a una nueva lectura',()=>{const m=memoria();let e=alternarFavorito(validar(null),'h335');e.tema='oscuro';e.tamano=3;assert.equal(guardar(m,e),true);assert.deepEqual(cargar(m),e);assert.deepEqual(alternarFavorito(e,'h335').favoritos,[]);});
test('Recientes únicos, en orden, limitados a quince',()=>{let e=validar(null);for(let i=0;i<20;i++)e=abrirReciente(e,String(i));e=abrirReciente(e,'10');assert.equal(e.recientes.length,15);assert.equal(e.recientes[0],'10');assert.equal(new Set(e.recientes).size,15);});
test('Datos corruptos y almacenamiento bloqueado no rompen la app',()=>{assert.deepEqual(cargar({getItem:()=>'{'}),validar(null));assert.equal(guardar({setItem:()=>{throw Error();}},validar(null)),false);assert.deepEqual(validar({tema:'otro',tamano:99,recientes:[1,'a','a']}),{tema:'sistema',tamano:1,recientes:['a'],favoritos:[]});});
import { categorias } from './categorias.js';
test('Catálogo completo sin huecos ni identificadores duplicados',()=>{assert.equal(himnos.length,340);assert.deepEqual(himnos.map(h=>h.numero),Array.from({length:340},(_,i)=>i+1));assert.equal(new Set(himnos.map(h=>h.id)).size,340);assert.ok(himnos.every(h=>h.contenido.some(b=>b.lineas.length)));});
test('El índice incluye 37 categorías y las 25 referencias de Evangelismo',()=>{assert.equal(categorias.length,37);const c=categorias.find(c=>c.id==='evangelismo');assert.deepEqual(c.entradas.map(e=>e.numeroIndice),[2,5,40,49,66,67,69,71,73,93,106,183,188,196,207,241,257,258,259,265,281,297,298,310,328]);});
test('No vincular números contradictorios del índice sin revisión',()=>{assert.equal(categorias.find(c=>c.id==='resurreccion').entradas[0].numero,38);assert.equal(categorias.find(c=>c.id==='resurreccion').entradas[0].estadoVinculo,'autorizado');assert.equal(categorias.find(c=>c.id==='testimonio').entradas[0].estadoVinculo,'autorizado');assert.equal(categorias.find(c=>c.id==='testimonio').entradas[0].numero,76);assert.ok(categorias.find(c=>c.id==='evangelismo').entradas.some(e=>e.numero===73));assert.equal(himnos.find(h=>h.numero===76).titulo,'CUANDO CRISTO LLEGO A MI VIDA.');});
test('Correcciones autorizadas del índice conservan el himno destino',()=>{const esperanza=categorias.find(c=>c.id==='esperanza').entradas.find(e=>e.tituloIndice==='QUE DICHA SERÁ.');assert.equal(esperanza.numero,266);assert.equal(himnos.find(h=>h.numero===266).titulo,'QUE DICHA SERÁ.');assert.equal(himnos.find(h=>h.numero===226).titulo,'MISIONERO QUE ANUNCIAS.');const emmaus=categorias.find(c=>c.id==='resurreccion').entradas[0];assert.equal(emmaus.numero,38);assert.equal(himnos.find(h=>h.numero===38).titulo,'CAMINO A EMMAUS.');assert.equal(himnos.find(h=>h.numero===3).titulo,'A DONDE IRÉ.');});
test('Evangelismo enlaza las 25 referencias autorizadas',()=>{const c=categorias.find(c=>c.id==='evangelismo');assert.equal(c.entradas.filter(e=>e.estadoVinculo!=='revisar'&&himnos.some(h=>h.numero===e.numero)).length,25);assert.equal(buscar(himnos,'SI VINIERES')[0].numero,298);assert.equal(himnos.find(h=>h.numero===31).titulo,'BENITO CORDERO DE DIOS.');});
import { vecinos } from './navegacion.js';
test('Anterior y siguiente permanecen dentro de cada categoría y respetan sus límites',()=>{
  for(const c of categorias){
    const numeros=[...new Set(c.entradas.filter(e=>e.estadoVinculo!=='revisar'&&himnos.some(h=>h.numero===e.numero)).map(e=>e.numero))];
    numeros.forEach((n,i)=>{const v=vecinos(himnos,categorias,n,`#categoria/${c.id}`);assert.equal(v.anterior?.numero,numeros[i-1]);assert.equal(v.siguiente?.numero,numeros[i+1]);});
  }
});
test('El catálogo conserva la navegación general por número',()=>{const v=vecinos(himnos,categorias,266,'#catalogo');assert.equal(v.anterior.numero,265);assert.equal(v.siguiente.numero,267);});
test('Búsqueda tolera errores e intercambios sin confundir números',()=>{assert.ok(buscar(himnos,'aumetname fe').some(h=>h.numero===21));assert.deepEqual(buscar(himnos,'0266').map(h=>h.numero),[266]);});
test('La búsqueda de letra se separa del título y prioriza coincidencias exactas',()=>{
 const datos=[{numero:1,titulo:'Esperanza',contenido:[{lineas:[{texto:'postrado de rodillas'}]}]},{numero:2,titulo:'Postrado de rodillas',contenido:[{lineas:[{texto:'otra canción'}]}]}];
 assert.deepEqual(buscar(datos,'postrado rodillas').map(h=>h.numero),[2]);
 assert.deepEqual(buscar(datos,'postrado de rodilas','letra').map(h=>h.numero),[1]);
 assert.deepEqual(buscar(datos,'POSTRADO, DE RODILLAS','letra').map(h=>h.numero),[1]);
});
