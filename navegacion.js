export function vecinos(himnos, categorias, numero, origen) {
  const categoria = categorias.find(c => origen === `#categoria/${c.id}`);
  const recorrido = categoria
    ? [...new Set(categoria.entradas.filter(e => e.estadoVinculo !== 'revisar').map(e => e.numero))].map(n => himnos.find(h => h.numero === n)).filter(Boolean)
    : himnos;
  const i = recorrido.findIndex(h => h.numero === numero);
  return i < 0 ? {} : { anterior: recorrido[i - 1], siguiente: recorrido[i + 1] };
}
