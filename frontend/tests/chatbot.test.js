// Pruebas unitarias del asistente de preguntas frecuentes (utils/chatbot.js). Ejecutan con `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MENSAJE_BIENVENIDA, PREGUNTAS_SUGERIDAS, responder } from '../src/utils/chatbot.js';

const niveles = [
  { id: 1, codigo: 'PRIMARIA', nombre: 'Nivel Primaria', rangoEdad: 'Ideal 6 a 11 años', precioMensual: 25, subtitulo: 'Bases sólidas' },
  { id: 2, codigo: 'SECUNDARIA', nombre: 'Nivel Secundaria', rangoEdad: '1.º a 5.º de Secundaria', precioMensual: 35, subtitulo: 'Buenas notas' },
  { id: 3, codigo: 'PRE', nombre: 'Nivel Preuniversitario', rangoEdad: 'Postulantes', precioMensual: 35.5, subtitulo: 'Ingresa a la universidad' },
];
const horarios = [
  { id: 1, turno: 'Mañana', horaInicio: '08:00', horaFin: '09:30', dias: 'Lunes a Viernes' },
  { id: 2, turno: 'Noche', horaInicio: '19:00', horaFin: '20:30', dias: 'Lunes a Viernes' },
];
const datos = { niveles, horarios };

test('CHAT-01 cada pregunta sugerida se entiende y no cae en la respuesta por defecto', () => {
  const esperado = ['precios', 'horarios', 'matricula', 'pago', 'diagnostico', 'grabadas'];
  PREGUNTAS_SUGERIDAS.forEach((pregunta, i) => {
    assert.equal(responder(pregunta, datos).id, esperado[i], pregunta);
  });
});

test('CHAT-02 los precios salen de los datos de la API, con formato en soles', () => {
  const r = responder('¿Cuánto cuestan los niveles?', datos);
  assert.match(r.texto, /Nivel Primaria.*S\/ 25 al mes/);
  assert.match(r.texto, /Nivel Secundaria.*S\/ 35 al mes/);
  assert.match(r.texto, /Nivel Preuniversitario.*S\/ 35\.50 al mes/);
});

test('CHAT-03 si nombra un nivel, responde solo ese nivel', () => {
  const r = responder('cuanto cuesta secundaria', datos);
  assert.equal(r.id, 'precios');
  assert.match(r.texto, /Secundaria/);
  assert.doesNotMatch(r.texto, /Primaria/);
  assert.doesNotMatch(r.texto, /Preuniversitario/);
});

test('CHAT-04 los horarios se muestran en formato de 12 horas', () => {
  const r = responder('que horarios tienen', datos);
  assert.match(r.texto, /Mañana: 8:00 a\. m\. a 9:30 a\. m\., Lunes a Viernes/);
  assert.match(r.texto, /Noche: 7:00 p\. m\. a 8:30 p\. m\./);
});

test('CHAT-05 ignora mayúsculas, tildes y signos', () => {
  assert.equal(responder('¿¡CUÁNTO CUESTA!?', datos).id, 'precios');
  assert.equal(responder('  diagnóstico  ', datos).id, 'diagnostico');
});

test('CHAT-06 "pre" no se confunde con "precio" y "nivel" se entiende en plural', () => {
  assert.equal(responder('precio', datos).id, 'precios');
  assert.equal(responder('que niveles hay', datos).id, 'niveles');
  assert.equal(responder('tienen pre', datos).id, 'niveles');
});

test('CHAT-07 un saludo no se confunde con una consulta de horarios', () => {
  assert.equal(responder('hola', datos).id, 'saludo');
  assert.equal(responder('Buenos días', datos).id, 'saludo');
  assert.equal(responder('buenas tardes', datos).id, 'saludo');
  assert.equal(responder('hola, cuanto cuesta', datos).id, 'precios');
});

test('CHAT-08 lo que no entiende se deriva a WhatsApp y vuelve a mostrar las preguntas rápidas', () => {
  const r = responder('xyzzy qwerty', datos);
  assert.equal(r.id, 'fallback');
  assert.deepEqual(r.acciones, ['whatsapp']);
  assert.equal(r.sugerir, true);
});

test('CHAT-09 un texto vacío o solo con espacios pide escribir algo', () => {
  assert.equal(responder('', datos).id, 'vacio');
  assert.equal(responder('   ', datos).id, 'vacio');
  assert.equal(responder(undefined, datos).id, 'vacio');
});

test('CHAT-10 sin datos de la API no falla y deriva a las secciones de la página', () => {
  for (const d of [undefined, {}, { niveles: null, horarios: null }]) {
    assert.match(responder('precios', d).texto, /sección/);
    assert.match(responder('horarios', d).texto, /sección/);
    assert.match(responder('niveles', d).texto, /Primaria/);
  }
});

test('CHAT-11 las intenciones de renovar, contraseña y persona llevan a WhatsApp', () => {
  assert.equal(responder('quiero renovar mi matrícula', datos).id, 'renovacion');
  assert.equal(responder('olvidé mi contraseña', datos).id, 'acceso');
  assert.equal(responder('quiero hablar con una persona', datos).id, 'contacto');
  for (const q of ['quiero renovar', 'olvidé mi clave', 'asesor']) {
    assert.ok(responder(q, datos).acciones.includes('whatsapp'), q);
  }
});

test('CHAT-12 el texto de la persona nunca se repite en la respuesta (no hay inyección de HTML)', () => {
  const ataque = '<script>alert(1)</script> <img src=x onerror=alert(1)>';
  const r = responder(ataque, datos);
  assert.equal(r.id, 'fallback');
  assert.doesNotMatch(r.texto, /<|script|onerror/i);
  assert.ok(MENSAJE_BIENVENIDA.length > 10);
});

test('CHAT-13 una entrada muy larga se procesa sin fallar', () => {
  const r = responder('horario '.repeat(5000), datos);
  assert.equal(r.id, 'horarios');
});

test('CHAT-14 toda respuesta incluye texto y solo acciones conocidas', () => {
  const conocidas = new Set(['diagnostico', 'registro', 'niveles', 'horarios', 'apoderado', 'whatsapp']);
  const preguntas = [...PREGUNTAS_SUGERIDAS, 'hola', '', 'xyz', 'renovar', 'metodo', 'contraseña', 'whatsapp', 'niveles'];
  for (const p of preguntas) {
    const r = responder(p, datos);
    assert.ok(r.texto.length > 0, p);
    r.acciones.forEach((a) => assert.ok(conocidas.has(a), `${p} → ${a}`));
  }
});

test('CHAT-15 las preguntas de padres explican la cuenta de apoderado y no se confunden con niveles', () => {
  for (const q of ['quiero ver el avance de mi hijo', 'soy mamá, puedo tener una cuenta', 'cuenta de apoderado', 'como va mi hija en las clases']) {
    const r = responder(q, datos);
    assert.equal(r.id, 'padres', q);
    assert.ok(r.acciones.includes('apoderado') && r.acciones.includes('whatsapp'), q);
    assert.match(r.texto, /vincula/);
  }
  assert.equal(responder('que niveles hay para mi hijo', datos).id, 'niveles');
  assert.equal(responder('cuanto cuesta', datos).id, 'precios');
});
