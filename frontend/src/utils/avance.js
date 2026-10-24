// Lógica pura del informe de avance que ven los padres (y el administrador). No usa React,
// por eso se prueba con `npm test`. Las importaciones llevan .js para que Node pueda ejecutarlas.
import { formatearDuracion, textoDias } from './format.js';

/** Cómo se muestra cada estado que calcula el servidor (ver ApoderadoService). */
export const ESTADOS_AVANCE = {
  AL_DIA: { etiqueta: 'Al día', tono: 'verde', explicacion: 'Está estudiando con regularidad: abrió clases en las últimas dos semanas.' },
  COMPLETADO: { etiqueta: 'Nivel completado', tono: 'indigo', explicacion: 'Ya vio todas las clases grabadas disponibles de su nivel.' },
  NUEVO: { etiqueta: 'Recién empieza', tono: 'azul', explicacion: 'Su matrícula comenzó hace poco y todavía no abre clases. Es normal en los primeros días.' },
  SIN_ACTIVIDAD: { etiqueta: 'Sin actividad reciente', tono: 'ambar', explicacion: 'Hace más de dos semanas que no abre una clase grabada. Conviene conversar con él o ella.' },
  PENDIENTE: { etiqueta: 'Matrícula por validar', tono: 'ambar', explicacion: 'Su matrícula está esperando la validación del pago por parte de la academia.' },
  SIN_MATRICULA: { etiqueta: 'Sin matrícula vigente', tono: 'gris', explicacion: 'No tiene una matrícula activa, por eso no hay clases ni avance que mostrar.' },
};

export function describirEstado(estado) {
  return ESTADOS_AVANCE[estado] || { etiqueta: estado || 'Sin datos', tono: 'gris', explicacion: '' };
}

const PARENTESCOS = { PADRE: 'Padre', MADRE: 'Madre', TUTOR: 'Tutor/a', APODERADO: 'Apoderado/a' };

export function etiquetaParentesco(valor) {
  return PARENTESCOS[valor] || '';
}

export const OPCIONES_PARENTESCO = Object.entries(PARENTESCOS).map(([id, texto]) => ({ id, texto }));

/** "Aún no abre clases", "Hoy", "Ayer" o "Hace 5 días". */
export function textoActividad(diasSinActividad) {
  if (diasSinActividad === null || diasSinActividad === undefined) return 'Aún no abre clases';
  if (diasSinActividad <= 0) return 'Hoy';
  if (diasSinActividad === 1) return 'Ayer';
  return `Hace ${diasSinActividad} días`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-10-12" → "12 oct" (etiqueta corta del lunes de cada semana). */
export function etiquetaSemana(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]}`;
}

/** Convierte las semanas del servidor al formato del gráfico de barras. */
export function serieSemanal(semanas) {
  return (semanas || []).map((s) => ({ etiqueta: etiquetaSemana(s.inicio), valores: [s.vistas] }));
}

export function totalSemanas(semanas) {
  return (semanas || []).reduce((suma, s) => suma + s.vistas, 0);
}

/** Una matrícula ACTIVA con fecha de fin pasada cuenta como vencida aunque la tarea diaria aún no la actualice. */
export function estadoMatriculaEfectivo(m, hoyIso) {
  if (m.estado === 'ACTIVA' && m.fechaFin && m.fechaFin < hoyIso) return 'VENCIDA';
  return m.estado;
}

/**
 * Avisos para el padre, de lo más importante a lo menos. Cada aviso: { id, tono, titulo, texto, accion }
 * donde `accion` indica qué botón mostrar: 'renovar' | 'contacto' | null.
 */
export function alertasAvance(avance) {
  if (!avance) return [];
  const nombre = (avance.nombre || 'Tu hijo').split(' ')[0];
  const avisos = [];
  if (avance.estado === 'SIN_ACTIVIDAD') {
    avisos.push({
      id: 'sin-actividad', tono: 'aviso', accion: 'contacto',
      titulo: `${nombre} no abre clases hace un tiempo`,
      texto: avance.diasSinActividad == null
        ? 'Todavía no abrió ninguna clase grabada. Anímalo a empezar por la más reciente.'
        : `Su última actividad fue ${textoActividad(avance.diasSinActividad).toLowerCase()}. Anímalo a retomar con una clase corta.`,
    });
  }
  if (avance.estado === 'PENDIENTE') {
    avisos.push({
      id: 'pendiente', tono: 'aviso', accion: 'contacto',
      titulo: 'Matrícula pendiente de validación',
      texto: 'Cuando la academia confirme el pago, las clases se habilitarán automáticamente.',
    });
  }
  if (avance.estado === 'SIN_MATRICULA') {
    avisos.push({
      id: 'sin-matricula', tono: 'info', accion: 'renovar',
      titulo: 'No hay una matrícula vigente',
      texto: 'Para que pueda ver las clases grabadas hace falta una matrícula activa.',
    });
  }
  const dias = avance.diasParaVencer;
  if (dias !== null && dias !== undefined && dias <= 7) {
    avisos.push({
      id: 'por-vencer', tono: 'aviso', accion: 'renovar',
      titulo: `La matrícula ${textoDias(dias)}`,
      texto: 'Renueva a tiempo para que no pierda el acceso a las clases.',
    });
  }
  if (avance.estado === 'COMPLETADO') {
    avisos.push({
      id: 'completado', tono: 'exito', accion: null,
      titulo: `¡${nombre} completó todas las clases de su nivel!`,
      texto: 'Pregunta a la academia por el siguiente nivel o por clases de refuerzo.',
    });
  }
  return avisos;
}

/** Texto de la tarjeta "Vigencia". */
export function textoVigencia(diasParaVencer) {
  if (diasParaVencer === null || diasParaVencer === undefined) return 'Sin matrícula vigente';
  return textoDias(diasParaVencer).replace(/^./, (c) => c.toUpperCase());
}

/** Resumen en una línea para la tarjeta del hijo: "2 de 4 clases vistas · 2 h 30 m". */
export function lineaProgreso(vistas, total, minutos) {
  const base = `${vistas} de ${total} clases vistas`;
  return minutos > 0 ? `${base} · ${formatearDuracion(minutos)}` : base;
}

/** Columnas y filas del informe en CSV (una fila por clase). Se usa con descargarCSV. */
export const COLUMNAS_INFORME = [
  { titulo: 'Clase', valor: (f) => f.titulo },
  { titulo: 'Nivel', valor: (f) => f.nivel },
  { titulo: 'Fecha de la clase', valor: (f) => f.fechaClase },
  { titulo: 'Duración (min)', valor: (f) => f.duracionMinutos },
  { titulo: 'Estado', valor: (f) => (f.vista ? 'Vista' : 'Pendiente') },
  { titulo: 'Última vez que la abrió', valor: (f) => f.ultimaVez || '' },
];

export function nombreArchivoInforme(avance, hoyIso) {
  const limpio = (avance?.username || 'alumno').toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `avance-${limpio}-${hoyIso}`;
}

/** Mensajes listos para escribir a la academia por WhatsApp desde el panel del padre. */
export function mensajeWhatsApp(tipo, { nombre, username } = {}) {
  const alumno = nombre || 'mi hijo/a';
  if (tipo === 'renovar') return `¡Hola! Quisiera renovar la matrícula de ${alumno} en Matemática Sin Estrés.`;
  if (tipo === 'contacto') return `¡Hola! Soy apoderado/a de ${alumno} en Matemática Sin Estrés y quisiera conversar sobre su avance.`;
  if (tipo === 'vincular') {
    return `¡Hola! Me registré como apoderado/a en Matemática Sin Estrés${username ? ` (usuario @${username})` : ''}. `
      + 'Quisiera vincular mi cuenta con el alumno/a: [escribe aquí el nombre de tu hijo/a].';
  }
  return '¡Hola! Quisiera información sobre Matemática Sin Estrés.';
}

/** true si el hijo necesita atención del padre (se usa para el contador de la barra lateral). */
export function necesitaAtencion(resumen) {
  if (!resumen) return false;
  const vence = resumen.diasParaVencer !== null && resumen.diasParaVencer !== undefined && resumen.diasParaVencer <= 7;
  return resumen.estado === 'SIN_ACTIVIDAD' || resumen.estado === 'PENDIENTE' || vence;
}
