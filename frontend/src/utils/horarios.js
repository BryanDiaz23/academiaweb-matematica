import { normalizar } from './format.js';

const PREFIJOS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const NOMBRES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/**
 * Convierte textos como "Lunes a Viernes", "Lunes, Miércoles y Viernes" o "Sábados"
 * en una lista de días de la semana (0 = domingo … 6 = sábado).
 */
export function parsearDias(texto) {
  const tokens = normalizar(texto).split(/[^a-z]+/).filter(Boolean);
  const dias = new Set();
  let previo = null;
  let rango = false;
  for (const t of tokens) {
    if (t === 'a') {
      rango = previo !== null;
      continue;
    }
    const idx = PREFIJOS.findIndex((p) => t.startsWith(p));
    if (idx === -1) continue;
    if (rango && previo !== null) {
      let i = previo;
      while (i !== idx) {
        i = (i + 1) % 7;
        dias.add(i);
      }
      rango = false;
    } else {
      dias.add(idx);
    }
    previo = idx;
  }
  return [...dias].sort((a, b) => a - b);
}

function conHora(base, hhmm) {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const f = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0, 0, 0);
  return f;
}

/**
 * Próxima sesión en vivo de un horario { dias, horaInicio, horaFin }.
 * Devuelve { inicio, fin, enCurso, dia } o null si los días no se pueden interpretar.
 */
export function proximaClase(horario, ahora = new Date()) {
  const dias = parsearDias(horario?.dias);
  if (dias.length === 0) return null;
  for (let i = 0; i < 8; i += 1) {
    const dia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i);
    if (!dias.includes(dia.getDay())) continue;
    const inicio = conHora(dia, horario.horaInicio);
    const fin = conHora(dia, horario.horaFin);
    if (fin <= ahora) continue;
    return { inicio, fin, enCurso: inicio <= ahora && ahora < fin, dia: dia.getDay(), offset: i };
  }
  return null;
}

/** "Hoy 17:00", "Mañana 08:00" o "Lunes 19:00". */
export function describirProxima(prox) {
  if (!prox) return '';
  const hora = prox.inicio.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (prox.enCurso) return `En curso ahora · hasta ${prox.fin.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  if (prox.offset === 0) return `Hoy a las ${hora}`;
  if (prox.offset === 1) return `Mañana a las ${hora}`;
  const nombre = NOMBRES[prox.dia];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} a las ${hora}`;
}

const dos = (n) => String(n).padStart(2, '0');
const formatoLocal = (f) => `${f.getFullYear()}${dos(f.getMonth() + 1)}${dos(f.getDate())}T${dos(f.getHours())}${dos(f.getMinutes())}00`;
const formatoUtc = (f) => `${f.getUTCFullYear()}${dos(f.getUTCMonth() + 1)}${dos(f.getUTCDate())}T${dos(f.getUTCHours())}${dos(f.getUTCMinutes())}${dos(f.getUTCSeconds())}Z`;

/** Archivo .ics con la clase en vivo repetida cada semana (hora de Lima). null si no se pueden leer los días. */
export function crearICS(horario, nombreNivel) {
  const dias = parsearDias(horario?.dias);
  const prox = proximaClase(horario);
  if (dias.length === 0 || !prox) return null;
  const resumen = `Clase en vivo${nombreNivel ? ` · ${nombreNivel}` : ''} — Matemática Sin Estrés`;
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Matematica Sin Estres//Aula Virtual//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VTIMEZONE',
    'TZID:America/Lima',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0500',
    'TZNAME:-05',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:mse-${horario.id || horario.turno}-${Date.now()}@matematicasinestres.pe`,
    `DTSTAMP:${formatoUtc(new Date())}`,
    `DTSTART;TZID=America/Lima:${formatoLocal(prox.inicio)}`,
    `DTEND;TZID=America/Lima:${formatoLocal(prox.fin)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dias.map((d) => BYDAY[d]).join(',')}`,
    `SUMMARY:${resumen}`,
    `DESCRIPTION:Turno ${horario.turno} (${horario.dias}).`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Tu clase empieza en 15 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lineas.join('\r\n');
}
