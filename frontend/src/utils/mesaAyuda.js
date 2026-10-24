// Reglas de presentación de la mesa de ayuda (solicitudes de servicio). Sin dependencias de React para poder probarlas.

export const ESTADOS_SOLICITUD = {
  ABIERTA: { etiqueta: 'Abierta', tono: 'azul' },
  EN_PROCESO: { etiqueta: 'En proceso', tono: 'ambar' },
  RESUELTA: { etiqueta: 'Resuelta', tono: 'verde' },
  CERRADA: { etiqueta: 'Cerrada', tono: 'gris' },
  RECHAZADA: { etiqueta: 'Rechazada', tono: 'rojo' },
};

export const ESTADOS_SLA = {
  EN_PLAZO: { etiqueta: 'En plazo', tono: 'verde' },
  POR_VENCER: { etiqueta: 'Por vencer', tono: 'ambar' },
  VENCIDA: { etiqueta: 'SLA vencido', tono: 'rojo' },
  CUMPLIDA: { etiqueta: 'SLA cumplido', tono: 'verde' },
  INCUMPLIDA: { etiqueta: 'Fuera de plazo', tono: 'rojo' },
};

export const PRIORIDADES = {
  ALTA: { etiqueta: 'Alta', tono: 'rojo', orden: 0 },
  MEDIA: { etiqueta: 'Media', tono: 'ambar', orden: 1 },
  BAJA: { etiqueta: 'Baja', tono: 'gris', orden: 2 },
};

/** Mismas transiciones que EstadoSolicitud.siguientes() en el back-end. */
const SIGUIENTES = {
  ABIERTA: ['EN_PROCESO', 'RESUELTA', 'RECHAZADA'],
  EN_PROCESO: ['RESUELTA', 'RECHAZADA'],
  RESUELTA: ['EN_PROCESO', 'CERRADA'],
  CERRADA: [],
  RECHAZADA: [],
};

export const describirEstado = (estado) => ESTADOS_SOLICITUD[estado] || { etiqueta: estado || '—', tono: 'gris' };
export const describirSla = (sla) => ESTADOS_SLA[sla] || { etiqueta: sla || '—', tono: 'gris' };
export const describirPrioridad = (p) => PRIORIDADES[p] || { etiqueta: p || '—', tono: 'gris', orden: 9 };

export const siguientesEstados = (estado) => SIGUIENTES[estado] || [];
export const esPendiente = (estado) => estado === 'ABIERTA' || estado === 'EN_PROCESO';
export const exigeRespuesta = (estado) => estado === 'RESUELTA' || estado === 'RECHAZADA';

/** "8 h", "2 días" */
export function textoSla(horas) {
  if (!horas && horas !== 0) return '';
  if (horas < 24) return `${horas} h`;
  const dias = horas / 24;
  return Number.isInteger(dias) ? `${dias} ${dias === 1 ? 'día' : 'días'}` : `${horas} h`;
}

/** Tiempo que queda antes del vencimiento del SLA: "quedan 3 h 20 min", "venció hace 2 h". */
export function tiempoRestante(venceEn, ahora = Date.now()) {
  if (!venceEn) return '';
  const fin = new Date(venceEn).getTime();
  if (Number.isNaN(fin)) return '';
  const min = Math.round((fin - ahora) / 60000);
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  let texto;
  if (h >= 48) texto = `${Math.floor(h / 24)} días`;
  else if (h > 0) texto = m > 0 ? `${h} h ${m} min` : `${h} h`;
  else texto = `${m} min`;
  return min >= 0 ? `quedan ${texto}` : `venció hace ${texto}`;
}

/** Orden de la cola de atención: pendientes primero, luego prioridad y vencimiento más cercano. */
export function ordenarCola(lista) {
  return [...lista].sort((a, b) => {
    const pa = esPendiente(a.estado) ? 0 : 1;
    const pb = esPendiente(b.estado) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const prio = describirPrioridad(a.prioridad).orden - describirPrioridad(b.prioridad).orden;
    if (pa === 0 && prio !== 0) return prio;
    if (pa === 0) return String(a.venceEn).localeCompare(String(b.venceEn));
    return String(b.actualizadoEn || '').localeCompare(String(a.actualizadoEn || ''));
  });
}

/** Valida el formulario con las mismas reglas que el servidor. Devuelve { campo: mensaje }. */
export function validarSolicitud({ tipo, asunto, descripcion }) {
  const errores = {};
  const html = /<[^>]*>|javascript:|on\w+\s*=/i;
  if (!tipo) errores.tipo = 'Elige el tipo de solicitud.';
  const a = (asunto || '').trim();
  if (a.length < 5) errores.asunto = 'Escribe un asunto de al menos 5 caracteres.';
  else if (a.length > 120) errores.asunto = 'El asunto admite hasta 120 caracteres.';
  else if (html.test(a)) errores.asunto = 'El asunto no puede contener etiquetas HTML.';
  const d = (descripcion || '').trim();
  if (d.length < 10) errores.descripcion = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  else if (d.length > 1000) errores.descripcion = 'La descripción admite hasta 1000 caracteres.';
  else if (html.test(d)) errores.descripcion = 'La descripción no puede contener etiquetas HTML.';
  return errores;
}
