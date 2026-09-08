// Solo estructura el texto: no corrige, completa ni elimina versos repetidos.
export function textoCompleto(contenido){
 return contenido.map(b=>[b.etiquetaOriginal,...b.lineas.map(l=>l.texto)].filter(x=>x!==null&&x!==undefined).join('\n')).join('\n\n');
}
export function separarLetra(texto){
 const bloques=[];let bloque=null;
 function terminar(){if(!bloque)return;if(!bloque.lineas.length)throw Error('Hay un encabezado sin letra. Revisa el texto pegado.');bloques.push(bloque);bloque=null;}
 for(const linea of texto.replace(/\r\n?/g,'\n').split('\n')){
  if(!linea.trim()){terminar();continue;}
  const encabezado=linea.trim();
  const coro=/^(coro|estribillo)(\s+\d+)?\s*[:.]?$/i.test(encabezado);
  const estrofa=/^(estrofa(?:\s+\d+)?|\d{1,2})\s*[:.)]?$/i.test(encabezado);
  const hablado=/^(hablado|introducci[oó]n)\s*[:.]?$/i.test(encabezado);
  if(coro||estrofa||hablado){terminar();bloque={tipo:coro?'coro':hablado?'hablado':'estrofa',etiquetaOriginal:linea,lineas:[]};}
  else{bloque||={tipo:'estrofa',etiquetaOriginal:null,lineas:[]};bloque.lineas.push({texto:linea});}
 }
 terminar();if(!bloques.length)throw Error('Pega la letra del himno.');return bloques;
}
