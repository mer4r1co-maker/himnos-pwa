export function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
export function buscar(himnos, consulta) {
  const q = normalizar(consulta);
  if (!q) return himnos;
  if (/^\d+$/.test(q)) return himnos.filter(h => h.numero === Number(q));
  const palabras = q.split(/\s+/);
  return himnos.filter(h => palabras.every(p => normalizar(h.titulo ?? h.tituloOriginal).includes(p)));
}
