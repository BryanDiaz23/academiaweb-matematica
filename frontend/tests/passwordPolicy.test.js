// Pruebas unitarias de utils/passwordPolicy.js. Replican los casos de PasswordPolicyTest.java para
// comprobar que la política del navegador y la del servidor dan el mismo veredicto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LONGITUD_MAXIMA, LONGITUD_MINIMA, REGLAS, evaluarPassword, generarPasswordSegura,
} from '../src/utils/passwordPolicy.js';

const DATOS = ['Ana Torres', 'atorres', 'ana@correo.pe'];

test('PWD-F01 acepta una contraseña robusta', () => {
  const r = evaluarPassword('Vr#9kQ!m2Lp@xZ', DATOS);
  assert.equal(r.valida, true);
  assert.equal(r.cumplidas, r.total);
  assert.equal(r.nivel, 'fuerte');
});

test('PWD-F02 una contraseña válida de 16 o más caracteres es "muy fuerte"', () => {
  assert.equal(evaluarPassword('Vr#9kQ!m2Lp@xZ7w', DATOS).nivel, 'muy fuerte');
});

const DEBILES = [
  ['123456', 'corta, sin letras ni símbolos'],
  ['contraseña', 'corta y común'],
  ['Password12345!', 'palabra común y secuencia'],
  ['Abcdefghijk1!', 'secuencia abcd'],
  ['Qwerty#2026Xy', 'patrón de teclado común'],
  ['Vr#9kQ!mmm2Lp@x', 'tres caracteres iguales seguidos'],
  ['Vr9kQm2LpxZtw', 'sin símbolo'],
  ['vr#9kq!m2lp@xz', 'sin mayúscula'],
  ['VR#9KQ!M2LP@XZ', 'sin minúscula'],
  ['Vr#kQ!mLp@xZtw', 'sin número'],
  ['Vr#9kQ! m2Lp@xZ', 'contiene espacio'],
];

for (const [clave, motivo] of DEBILES) {
  test(`PWD-F03 rechaza "${clave}" (${motivo})`, () => {
    assert.equal(evaluarPassword(clave, DATOS).valida, false);
  });
}

test('PWD-F04 la regla "personal" detecta el nombre, el usuario o la parte local del correo', () => {
  const personalFalla = (clave, datos) => evaluarPassword(clave, datos).reglas.find((r) => r.id === 'personal').cumple === false;
  assert.equal(personalFalla('Lrojas#9kQ!mZ', ['Luis Rojas', 'lrojas']), true); // usuario
  assert.equal(personalFalla('Torres#9kQ!mZw', DATOS), true);                   // apellido
  assert.equal(personalFalla('Xana#9kQ!mZw2', DATOS), true);                    // parte local del correo
  assert.equal(personalFalla('Vr#9kQ!m2Lp@xZ', DATOS), false);                  // sin datos personales
  assert.equal(evaluarPassword('Lrojas#9kQ!mZ', ['Luis Rojas', 'lrojas']).valida, false);
});

test('PWD-F05 la contraseña vacía incumple todas las reglas y es "muy débil"', () => {
  const r = evaluarPassword('', []);
  assert.equal(r.valida, false);
  assert.equal(r.nivel, 'muy débil');
});

test('PWD-F06 hay 10 reglas con identificador único y los límites coinciden con el servidor', () => {
  assert.equal(REGLAS.length, 10);
  assert.equal(new Set(REGLAS.map((r) => r.id)).size, 10);
  assert.equal(LONGITUD_MINIMA, 12);
  assert.equal(LONGITUD_MAXIMA, 64);
});

test('PWD-F07 rechaza contraseñas de más de 64 caracteres', () => {
  assert.equal(evaluarPassword(`Vr#9kQ!m2Lp@xZ${'k7#Q'.repeat(15)}`, []).valida, false);
});

test('PWD-F08 generarPasswordSegura produce contraseñas que cumplen la política', () => {
  globalThis.window = { crypto: globalThis.crypto }; // en el navegador existe window.crypto
  const vistas = new Set();
  for (let i = 0; i < 100; i += 1) {
    const p = generarPasswordSegura(18, DATOS);
    assert.equal(p.length, 18);
    assert.equal(evaluarPassword(p, DATOS).valida, true, `la contraseña generada ${p} debe cumplir la política`);
    vistas.add(p);
  }
  assert.equal(vistas.size, 100);
});
