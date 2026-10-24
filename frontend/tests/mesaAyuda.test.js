// Pruebas unitarias de utils/mesaAyuda.js (mesa de ayuda, APF3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describirEstado, describirSla, esPendiente, exigeRespuesta, ordenarCola, siguientesEstados,
  textoSla, tiempoRestante, validarSolicitud,
} from '../src/utils/mesaAyuda.js';

test('MDA-F01 textoSla expresa el plazo en horas o días', () => {
  assert.equal(textoSla(4), '4 h');
  assert.equal(textoSla(24), '1 día');
  assert.equal(textoSla(48), '2 días');
  assert.equal(textoSla(30), '30 h');
  assert.equal(textoSla(null), '');
});

test('MDA-F02 tiempoRestante distingue plazo vigente y vencido', () => {
  const ahora = Date.parse('2026-10-20T08:00:00');
  assert.equal(tiempoRestante('2026-10-20T11:20:00', ahora), 'quedan 3 h 20 min');
  assert.equal(tiempoRestante('2026-10-20T08:45:00', ahora), 'quedan 45 min');
  assert.equal(tiempoRestante('2026-10-20T06:00:00', ahora), 'venció hace 2 h');
  assert.equal(tiempoRestante('2026-10-23T08:00:00', ahora), 'quedan 3 días');
  assert.equal(tiempoRestante(null, ahora), '');
});

test('MDA-F03 Las transiciones coinciden con las del servidor', () => {
  assert.deepEqual(siguientesEstados('ABIERTA'), ['EN_PROCESO', 'RESUELTA', 'RECHAZADA']);
  assert.deepEqual(siguientesEstados('CERRADA'), []);
  assert.deepEqual(siguientesEstados('RECHAZADA'), []);
  assert.ok(siguientesEstados('RESUELTA').includes('CERRADA'));
});

test('MDA-F04 Pendientes y estados que exigen respuesta', () => {
  assert.ok(esPendiente('ABIERTA'));
  assert.ok(esPendiente('EN_PROCESO'));
  assert.ok(!esPendiente('RESUELTA'));
  assert.ok(exigeRespuesta('RESUELTA'));
  assert.ok(exigeRespuesta('RECHAZADA'));
  assert.ok(!exigeRespuesta('EN_PROCESO'));
});

test('MDA-F05 Etiquetas y tonos de estado y SLA', () => {
  assert.equal(describirEstado('EN_PROCESO').etiqueta, 'En proceso');
  assert.equal(describirSla('VENCIDA').tono, 'rojo');
  assert.equal(describirSla('OTRO').etiqueta, 'OTRO');
});

test('MDA-F06 La cola pone primero lo pendiente, luego la prioridad y el vencimiento', () => {
  const cola = ordenarCola([
    { id: 1, estado: 'RESUELTA', prioridad: 'ALTA', venceEn: '2026-10-20T09:00', actualizadoEn: '2026-10-20T09:00' },
    { id: 2, estado: 'ABIERTA', prioridad: 'BAJA', venceEn: '2026-10-20T10:00' },
    { id: 3, estado: 'EN_PROCESO', prioridad: 'ALTA', venceEn: '2026-10-21T10:00' },
    { id: 4, estado: 'ABIERTA', prioridad: 'ALTA', venceEn: '2026-10-20T12:00' },
  ]);
  assert.deepEqual(cola.map((s) => s.id), [4, 3, 2, 1]);
});

test('MDA-F07 validarSolicitud aplica las reglas del servidor', () => {
  assert.deepEqual(validarSolicitud({ tipo: 'INFORMACION', asunto: 'Precio de PRE', descripcion: '¿Cuánto cuesta el nivel PRE?' }), {});
  const e = validarSolicitud({ tipo: '', asunto: 'Hola', descripcion: 'corto' });
  assert.ok(e.tipo && e.asunto && e.descripcion);
  assert.ok(validarSolicitud({ tipo: 'INFORMACION', asunto: '<b>Precio</b>', descripcion: 'Descripción válida aquí' }).asunto);
  assert.ok(validarSolicitud({ tipo: 'INFORMACION', asunto: 'Asunto ok', descripcion: 'javascript:alert(1) ...' }).descripcion);
});
