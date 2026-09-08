export function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
const limpiar = texto => normalizar(texto).replace(/[^a-z0-9]+/g,' ').trim();
const indices = new WeakMap();
function indexar(himnos, modo) {
  if(!indices.has(himnos))indices.set(himnos,{});
  const cache=indices.get(himnos);
  return cache[modo] ||= himnos.map(h=>{
    const texto=limpiar(modo==='letra' ? (h.contenido||[]).flatMap(b=>b.lineas.map(l=>l.texto)).join(' ') : h.titulo??h.tituloOriginal);
    return {h,texto,palabras:[...new Set(texto.split(' '))]};
  });
}
// Damerau-Levenshtein: incluye letras intercambiadas, omitidas o equivocadas.
function distancia(a,b,max) {
  if(Math.abs(a.length-b.length)>max)return max+1;
  let prev=Array.from({length:b.length+1},(_,i)=>i),antes;
  for(let i=1;i<=a.length;i++){
    const row=[i];
    for(let j=1;j<=b.length;j++){
      row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])row[j]=Math.min(row[j],antes[j-2]+1);
    }
    antes=prev;prev=row;
  }
  return prev[b.length];
}
export function buscar(himnos, consulta, modo='titulo') {
  const q=limpiar(consulta);
  if(!q)return himnos;
  if(modo!=='letra'&&/^\d+$/.test(q))return himnos.filter(h=>h.numero===Number(q));
  const tokens=[...new Set(q.split(' '))];
  const aproximaciones=new Map();
  const resultados=[];
  for(const item of indexar(himnos,modo)){
    let score=item.texto===q?0:item.texto.includes(q)?1:2;
    if(score===2){
      for(const token of tokens){
        if(item.texto.includes(token))continue;
        const max=token.length>=8?2:token.length>=4?1:0;
        if(!max){score=Infinity;break;}
        let coincide=false;
        for(const palabra of item.palabras){
          const key=token+'|'+palabra;
          if(!aproximaciones.has(key))aproximaciones.set(key,distancia(token,palabra,max)<=max);
          if(aproximaciones.get(key)){coincide=true;break;}
        }
        if(!coincide){score=Infinity;break;}
        score+=3;
      }
    }
    if(Number.isFinite(score))resultados.push({h:item.h,score});
  }
  return resultados.sort((a,b)=>a.score-b.score||a.h.numero-b.h.numero).map(r=>r.h);
}
