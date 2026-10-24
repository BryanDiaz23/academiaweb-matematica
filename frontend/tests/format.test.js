// Pruebas unitarias de utils/format.js (ejecutan con el runner nativo de Node: `npm test`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aISO, diasHasta, formatearDuracion, formatearFecha, formatearPrecio, formatearSoles,
  iniciales, normalizar, saludo, sumarMesesISO, textoDias, tiempoRelativo, urlSegura,
} from '../src/utils/format.js';

test('FMT-01 formatearDuracion convierte minutos a horas y minutos', () => {
  assert.equal(formatearDuracion(45), '45 min');
  assert.equal(formatearDuracion(60), '1h');
  assert.equal(formatearDuracion(90), '1h 30m');
  assert.equal(formatearDuracion(0), '0 min');
  assert.equal(formatearDuracion(null), '');
  assert.equal(formatearDuracion(undefined), '');
});

test('FMT-02 urlSegura solo acepta enlaces https y rechaza esquemas peligrosos (defensa XSS)', () => {
  assert.equal(urlSegura('https://www.youtube.com/watch?v=abc'), 'https://www.youtube.com/watch?v=abc');
  assert.equal(urlSegura('http://sitio.pe/video'), null);
  assert.equal(urlSegura('javascript:alert(1)'), null);
  assert.equal(urlSegura('data:text/html,<b>x</b>'), null);
  assert.equal(urlSegura('https://x.pe/a b'), null);
  assert.equal(urlSegura('https://x.pe/"onmouseover="alert(1)'), null);
  assert.equal(urlSegura(null), null);
  assert.equal(urlSegura(42), null);
});

test('FMT-03 formatearPrecio muestra enteros sin decimales y decimales con dos cifras', () => {
  assert.equal(formatearPrecio(35), '35');
  assert.equal(formatearPrecio('35'), '35');
  assert.equal(formatearPrecio(35.5), '35.50');
  assert.equal(formatearPrecio('no-numero'), 'no-numero');
});

test('FMT-04 formatearSoles antepone S/ y tolera valores inválidos', () => {
  assert.equal(formatearSoles(35), 'S/ 35');
  assert.equal(formatearSoles('x'), 'S/ 0');
});

test('FMT-05 normalizar quita tildes y pasa a minúsculas (búsquedas sin acentos)', () => {
  assert.equal(normalizar('Matemáticas ÁLGEBRA'), 'matematicas algebra');
  assert.equal(normalizar(null), '');
  assert.equal(normalizar(undefined), '');
});

test('FMT-06 aISO produce AAAA-MM-DD con fecha local', () => {
  assert.equal(aISO(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(aISO(new Date(2026, 11, 31)), '2026-12-31');
});

test('FMT-07 diasHasta cuenta días respecto de hoy', () => {
  const hoy = new Date();
  const desplazar = (n) => aISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n));
  assert.equal(diasHasta(desplazar(0)), 0);
  assert.equal(diasHasta(desplazar(1)), 1);
  assert.equal(diasHasta(desplazar(7)), 7);
  assert.equal(diasHasta(desplazar(-1)), -1);
  assert.equal(diasHasta(null), null);
});

test('FMT-08 sumarMesesISO respeta el fin de mes (igual que LocalDate.plusMonths del servidor)', () => {
  assert.equal(sumarMesesISO('2026-10-14', 1), '2026-11-14');
  assert.equal(sumarMesesISO('2026-01-31', 1), '2026-02-28');
  assert.equal(sumarMesesISO('2028-01-31', 1), '2028-02-29'); // año bisiesto
  assert.equal(sumarMesesISO('2026-12-15', 2), '2027-02-15');
  assert.equal(sumarMesesISO('2026-03-31', 1), '2026-04-30');
});

test('FMT-09 textoDias describe la vigencia de una matrícula', () => {
  assert.equal(textoDias(0), 'vence hoy');
  assert.equal(textoDias(1), 'vence mañana');
  assert.equal(textoDias(5), 'vence en 5 días');
  assert.equal(textoDias(-1), 'venció ayer');
  assert.equal(textoDias(-3), 'venció hace 3 días');
  assert.equal(textoDias(null), '');
});

test('FMT-10 iniciales toma hasta dos letras del nombre', () => {
  assert.equal(iniciales('Ana Torres'), 'AT');
  assert.equal(iniciales('ana'), 'AN');
  assert.equal(iniciales('  '), '?');
  assert.equal(iniciales(''), '?');
  assert.equal(iniciales(null), '?');
});

test('FMT-11 saludo cambia según la hora del día', () => {
  assert.equal(saludo(new Date(2026, 0, 1, 9)), 'Buenos días');
  assert.equal(saludo(new Date(2026, 0, 1, 12)), 'Buenas tardes');
  assert.equal(saludo(new Date(2026, 0, 1, 18)), 'Buenas tardes');
  assert.equal(saludo(new Date(2026, 0, 1, 19)), 'Buenas noches');
});

test('FMT-12 tiempoRelativo expresa la antigüedad en lenguaje natural', () => {
  const hace = (ms) => new Date(Date.now() - ms).toISOString();
  const MIN = 60 * 1000;
  assert.equal(tiempoRelativo(hace(5 * 1000)), 'hace un momento');
  assert.equal(tiempoRelativo(hace(5 * MIN)), 'hace 5 min');
  assert.equal(tiempoRelativo(hace(3 * 60 * MIN)), 'hace 3 h');
  assert.equal(tiempoRelativo(hace(25 * 60 * MIN)), 'ayer');
  assert.equal(tiempoRelativo(hace(4 * 24 * 60 * MIN)), 'hace 4 días');
  assert.equal(tiempoRelativo(null), '—');
});

test('FMT-13 formatearFecha interpreta AAAA-MM-DD sin desfase de zona horaria', () => {
  const texto = formatearFecha('2026-09-28');
  assert.match(texto, /28/);
  assert.match(texto, /2026/);
  assert.equal(formatearFecha(''), '');
});
