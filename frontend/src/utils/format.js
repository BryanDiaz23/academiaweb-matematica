export function formatearDuracion(minutos) {
  if (!minutos && minutos !== 0) return '';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Convierte "2026-09-28" en fecha local sin desfase de zona horaria. */
export function formatearFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearFechaHora(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatearPrecio(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return valor;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Solo se permiten enlaces https:// en atributos href (defensa adicional contra XSS). */
export function urlSegura(url) {
  return typeof url === 'string' && /^https:\/\/[^\s<>"']+$/i.test(url) ? url : null;
}

// ---------------------------------------------------------------------------
// Utilidades de fechas y textos compartidas por el Aula y el Panel de administración
// ---------------------------------------------------------------------------

/** Minúsculas y sin tildes: para búsquedas que ignoran acentos. */
export const normalizar = (t) => (t ?? '').toString().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** Fecha local en formato "AAAA-MM-DD" (sin desfase de zona horaria). */
export function aISO(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export const hoyISO = () => aISO(new Date());

function aFechaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Días que faltan para una fecha "AAAA-MM-DD" (0 = hoy, negativo = ya pasó). null si no hay fecha. */
export function diasHasta(iso) {
  if (!iso) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((aFechaLocal(iso) - hoy) / 86400000);
}

/** Suma meses a una fecha "AAAA-MM-DD" respetando fin de mes (igual que LocalDate.plusMonths del servidor). */
export function sumarMesesISO(iso, meses) {
  const base = aFechaLocal(iso);
  const dia = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + meses);
  const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(dia, ultimo));
  return aISO(base);
}

/** Saludo según la hora del día. */
export function saludo(fecha = new Date()) {
  const h = fecha.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function iniciales(nombre) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días" o la fecha si es antigua. */
export function tiempoRelativo(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  const seg = Math.max(0, Math.round((Date.now() - fecha.getTime()) / 1000));
  if (seg < 60) return 'hace un momento';
  const min = Math.floor(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatearSoles(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return 'S/ 0';
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** "3 días", "mañana", "hoy", "vencida hace 2 días". */
export function textoDias(dias) {
  if (dias === null || dias === undefined) return '';
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  if (dias > 1) return `vence en ${dias} días`;
  if (dias === -1) return 'venció ayer';
  return `venció hace ${Math.abs(dias)} días`;
}
