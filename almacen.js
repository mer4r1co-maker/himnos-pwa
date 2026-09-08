export const CLAVE = 'himnos.preferencias.v1';
export function validar(valor) {
  const v = valor && typeof valor === 'object' ? valor : {};
  const ids = a => Array.isArray(a) ? [...new Set(a.filter(x => typeof x === 'string'))] : [];
  return { favoritos: ids(v.favoritos), recientes: ids(v.recientes).slice(0,15), tema: ['sistema','claro','oscuro'].includes(v.tema) ? v.tema : 'sistema', tamano: Number.isInteger(v.tamano) && v.tamano >= 0 && v.tamano <= 3 ? v.tamano : 1 };
}
export function cargar(storage) {
  try { return validar(JSON.parse(storage.getItem(CLAVE))); } catch { return validar(null); }
}
export function guardar(storage, estado) {
  try { storage.setItem(CLAVE, JSON.stringify(validar(estado))); return true; } catch { return false; }
}
export function abrirReciente(estado, id) { return { ...estado, recientes: [id, ...estado.recientes.filter(x => x !== id)].slice(0,15) }; }
export function alternarFavorito(estado, id) { return { ...estado, favoritos: estado.favoritos.includes(id) ? estado.favoritos.filter(x => x !== id) : [...estado.favoritos,id] }; }
