// Pruebas unitarias de utils/horarios.js (interpretación de horarios y recordatorio .ics).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearICS, describirProxima, parsearDias, proximaClase } from '../src/utils/horarios.js';

const LUN_A_VIE = { id: 1, turno: 'Tarde', dias: 'Lunes a Viernes', horaInicio: '17:00', horaFin: '19:00' };
// 14/10/2026 es miércoles; 16/10/2026 es viernes.
const miercoles = (h, m = 0) => new Date(2026, 9, 14, h, m);
const viernes = (h, m = 0) => new Date(2026, 9, 16, h, m);

test('HOR-01 parsearDias entiende rangos, listas y plurales', () => {
  assert.deepEqual(parsearDias('Lunes a Viernes'), [1, 2, 3, 4, 5]);
  assert.deepEqual(parsearDias('Lunes, Miércoles y Viernes'), [1, 3, 5]);
  assert.deepEqual(parsearDias('Sábados'), [6]);
  assert.deepEqual(parsearDias('Sábado y Domingo'), [0, 6]);
  assert.deepEqual(parsearDias('Viernes a Lunes'), [0, 1, 5, 6]); // el rango cruza el fin de semana
  assert.deepEqual(parsearDias('texto sin días'), []);
  assert.deepEqual(parsearDias(undefined), []);
});

test('HOR-02 proximaClase: antes de la hora de inicio es hoy y no está en curso', () => {
  const p = proximaClase(LUN_A_VIE, miercoles(10));
  assert.equal(p.offset, 0);
  assert.equal(p.enCurso, false);
  assert.equal(p.inicio.getHours(), 17);
  assert.equal(p.fin.getHours(), 19);
});

test('HOR-03 proximaClase: dentro del horario la clase está en curso', () => {
  const p = proximaClase(LUN_A_VIE, miercoles(18));
  assert.equal(p.offset, 0);
  assert.equal(p.enCurso, true);
});

test('HOR-04 proximaClase: terminada la clase de hoy pasa a mañana', () => {
  const p = proximaClase(LUN_A_VIE, miercoles(20));
  assert.equal(p.offset, 1);
  assert.equal(p.dia, 4); // jueves
});

test('HOR-05 proximaClase: el viernes por la noche la próxima es el lunes (3 días)', () => {
  const p = proximaClase(LUN_A_VIE, viernes(20));
  assert.equal(p.offset, 3);
  assert.equal(p.dia, 1);
});

test('HOR-06 proximaClase devuelve null si los días no se pueden interpretar', () => {
  assert.equal(proximaClase({ dias: '???', horaInicio: '08:00', horaFin: '10:00' }, miercoles(9)), null);
});

test('HOR-07 describirProxima redacta hoy, mañana, día de la semana o en curso', () => {
  assert.match(describirProxima(proximaClase(LUN_A_VIE, miercoles(10))), /^Hoy a las /);
  assert.match(describirProxima(proximaClase(LUN_A_VIE, miercoles(20))), /^Mañana a las /);
  assert.match(describirProxima(proximaClase(LUN_A_VIE, viernes(20))), /^Lunes a las /);
  assert.match(describirProxima(proximaClase(LUN_A_VIE, miercoles(18))), /^En curso ahora/);
  assert.equal(describirProxima(null), '');
});

test('HOR-08 crearICS genera un calendario semanal con alarma de 15 minutos', () => {
  const ics = crearICS(LUN_A_VIE, 'Secundaria');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  assert.match(ics, /TZID=America\/Lima/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.match(ics, /Secundaria/);
  assert.ok(ics.includes('\r\n'), 'las líneas del .ics deben terminar en CRLF');
});

test('HOR-09 crearICS devuelve null si no hay días interpretables', () => {
  assert.equal(crearICS({ dias: '???', horaInicio: '08:00', horaFin: '10:00' }, 'X'), null);
});
