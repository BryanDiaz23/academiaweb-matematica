// Pruebas unitarias del informe de avance para apoderados (utils/avance.js). Ejecutan con `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alertasAvance, COLUMNAS_INFORME, describirEstado, ESTADOS_AVANCE, estadoMatriculaEfectivo, etiquetaParentesco,
  etiquetaSemana, lineaProgreso, mensajeWhatsApp, necesitaAtencion, nombreArchivoInforme, serieSemanal, textoActividad,
  textoVigencia, totalSemanas,
} from '../src/utils/avance.js';

test('FAM-01 cada estado del servidor tiene etiqueta, color y explicación; uno desconocido no rompe', () => {
  for (const clave of ['AL_DIA', 'COMPLETADO', 'NUEVO', 'SIN_ACTIVIDAD', 'PENDIENTE', 'SIN_MATRICULA']) {
    const e = describirEstado(clave);
    assert.ok(e.etiqueta && e.tono && e.explicacion, clave);
  }
  assert.equal(Object.keys(ESTADOS_AVANCE).length, 6);
  const raro = describirEstado('ALGO_NUEVO');
  assert.equal(raro.etiqueta, 'ALGO_NUEVO');
  assert.equal(raro.tono, 'gris');
  assert.equal(describirEstado(undefined).etiqueta, 'Sin datos');
});

test('FAM-02 textoActividad: nunca, hoy, ayer y hace N días', () => {
  assert.equal(textoActividad(null), 'Aún no abre clases');
  assert.equal(textoActividad(undefined), 'Aún no abre clases');
  assert.equal(textoActividad(0), 'Hoy');
  assert.equal(textoActividad(1), 'Ayer');
  assert.equal(textoActividad(9), 'Hace 9 días');
});

test('FAM-03 las semanas se convierten al formato del gráfico y se suman', () => {
  const semanas = [{ inicio: '2026-09-07', vistas: 0 }, { inicio: '2026-10-12', vistas: 3 }];
  assert.deepEqual(serieSemanal(semanas), [
    { etiqueta: '7 sep', valores: [0] },
    { etiqueta: '12 oct', valores: [3] },
  ]);
  assert.equal(totalSemanas(semanas), 3);
  assert.deepEqual(serieSemanal(undefined), []);
  assert.equal(etiquetaSemana(''), '');
});

test('FAM-04 alerta de falta de actividad con y sin clases abiertas antes', () => {
  const a = alertasAvance({ nombre: 'Camila Paredes', estado: 'SIN_ACTIVIDAD', diasSinActividad: 20, diasParaVencer: 30 });
  assert.equal(a.length, 1);
  assert.equal(a[0].id, 'sin-actividad');
  assert.match(a[0].titulo, /Camila/);
  assert.match(a[0].texto, /hace 20 días/);
  const nunca = alertasAvance({ nombre: 'Luis Soto', estado: 'SIN_ACTIVIDAD', diasSinActividad: null, diasParaVencer: null });
  assert.match(nunca[0].texto, /Todavía no abrió/);
});

test('FAM-05 avisa cuando la matrícula vence en 7 días o menos, pero no antes', () => {
  const base = { nombre: 'Ana', estado: 'AL_DIA', diasSinActividad: 1 };
  assert.equal(alertasAvance({ ...base, diasParaVencer: 8 }).length, 0);
  const vence = alertasAvance({ ...base, diasParaVencer: 7 });
  assert.equal(vence[0].id, 'por-vencer');
  assert.equal(vence[0].accion, 'renovar');
  assert.match(vence[0].titulo, /vence en 7 días/);
  assert.match(alertasAvance({ ...base, diasParaVencer: 0 })[0].titulo, /vence hoy/);
});

test('FAM-06 pendiente, sin matrícula y completado generan su aviso; un alumno al día no genera ninguno', () => {
  assert.equal(alertasAvance({ nombre: 'A', estado: 'PENDIENTE' })[0].id, 'pendiente');
  assert.equal(alertasAvance({ nombre: 'A', estado: 'SIN_MATRICULA' })[0].id, 'sin-matricula');
  const ok = alertasAvance({ nombre: 'Ana Ruiz', estado: 'COMPLETADO', diasParaVencer: 40 });
  assert.equal(ok[0].tono, 'exito');
  assert.match(ok[0].titulo, /Ana/);
  assert.deepEqual(alertasAvance({ nombre: 'A', estado: 'AL_DIA', diasParaVencer: 40 }), []);
  assert.deepEqual(alertasAvance(null), []);
});

test('FAM-07 el contador de "necesitan atención" cuenta inactivos, pendientes y por vencer', () => {
  assert.equal(necesitaAtencion({ estado: 'SIN_ACTIVIDAD' }), true);
  assert.equal(necesitaAtencion({ estado: 'PENDIENTE' }), true);
  assert.equal(necesitaAtencion({ estado: 'AL_DIA', diasParaVencer: 3 }), true);
  assert.equal(necesitaAtencion({ estado: 'AL_DIA', diasParaVencer: 20 }), false);
  assert.equal(necesitaAtencion({ estado: 'NUEVO', diasParaVencer: null }), false);
  assert.equal(necesitaAtencion(null), false);
});

test('FAM-08 textos de vigencia, parentesco y progreso', () => {
  assert.equal(textoVigencia(null), 'Sin matrícula vigente');
  assert.equal(textoVigencia(12), 'Vence en 12 días');
  assert.equal(textoVigencia(0), 'Vence hoy');
  assert.equal(etiquetaParentesco('MADRE'), 'Madre');
  assert.equal(etiquetaParentesco('TUTOR'), 'Tutor/a');
  assert.equal(etiquetaParentesco(null), '');
  assert.equal(lineaProgreso(2, 4, 150), '2 de 4 clases vistas · 2h 30m');
  assert.equal(lineaProgreso(0, 4, 0), '0 de 4 clases vistas');
});

test('FAM-09 una matrícula activa con la fecha de fin vencida se muestra como vencida', () => {
  assert.equal(estadoMatriculaEfectivo({ estado: 'ACTIVA', fechaFin: '2026-10-01' }, '2026-10-14'), 'VENCIDA');
  assert.equal(estadoMatriculaEfectivo({ estado: 'ACTIVA', fechaFin: '2026-10-14' }, '2026-10-14'), 'ACTIVA');
  assert.equal(estadoMatriculaEfectivo({ estado: 'PENDIENTE', fechaFin: null }, '2026-10-14'), 'PENDIENTE');
});

test('FAM-10 el CSV del informe tiene una fila por clase y marca Vista o Pendiente', () => {
  const clase = { titulo: 'Álgebra', nivel: 'Nivel Secundaria', fechaClase: '2026-09-28', duracionMinutos: 90, vista: true, ultimaVez: '2026-10-10T10:00:00' };
  const pendiente = { ...clase, vista: false, ultimaVez: null };
  const fila = (c) => COLUMNAS_INFORME.map((col) => col.valor(c));
  assert.deepEqual(fila(clase), ['Álgebra', 'Nivel Secundaria', '2026-09-28', 90, 'Vista', '2026-10-10T10:00:00']);
  assert.deepEqual(fila(pendiente).slice(4), ['Pendiente', '']);
});

test('FAM-11 el nombre del archivo del informe es seguro', () => {
  assert.equal(nombreArchivoInforme({ username: 'Camila.Paredes' }, '2026-10-14'), 'avance-camila.paredes-2026-10-14');
  assert.equal(nombreArchivoInforme({ username: '../../etc/passwd' }, '2026-10-14'), 'avance-....etcpasswd-2026-10-14');
  assert.equal(nombreArchivoInforme(null, '2026-10-14'), 'avance-alumno-2026-10-14');
});

test('FAM-12 los mensajes de WhatsApp incluyen el nombre del hijo y tienen un texto de respaldo', () => {
  assert.match(mensajeWhatsApp('renovar', { nombre: 'Camila Paredes' }), /renovar la matrícula de Camila Paredes/);
  assert.match(mensajeWhatsApp('contacto', { nombre: 'Luis' }), /apoderado\/a de Luis/);
  assert.match(mensajeWhatsApp('vincular', { username: 'madre.paredes' }), /@madre\.paredes/);
  assert.match(mensajeWhatsApp('vincular', {}), /\[escribe aquí el nombre/);
  assert.match(mensajeWhatsApp('renovar', {}), /mi hijo\/a/);
  assert.match(mensajeWhatsApp('otro'), /información/);
});
