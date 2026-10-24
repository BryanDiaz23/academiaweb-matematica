// Réplica en el cliente de la política de contraseñas del servidor (PasswordPolicy.java).
// Sirve para guiar al usuario en tiempo real; la validación definitiva la hace el back-end.

export const LONGITUD_MINIMA = 12;
export const LONGITUD_MAXIMA = 64;

const PALABRAS_COMUNES = [
  'password', 'contrasena', 'clave', 'qwerty', 'asdf', 'zxcv', '123456', '12345678',
  '111111', '000000', 'abc123', 'admin', 'administrador', 'usuario', 'letmein',
  'welcome', 'bienvenido', 'iloveyou', 'teamo', 'dragon', 'monkey', 'football',
  'matematica', 'matematicas', 'sinestres', 'estres', 'academia', 'peru', 'lima',
];

export function normalizar(texto) {
  return (texto || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function tieneSecuencia(password) {
  const t = password.toLowerCase();
  const esDigito = (c) => c >= '0' && c <= '9';
  const esLetra = (c) => c >= 'a' && c <= 'z';
  for (let i = 0; i + 3 < t.length; i += 1) {
    const grupo = [t[i], t[i + 1], t[i + 2], t[i + 3]];
    const mismaClase = grupo.every(esDigito) || grupo.every(esLetra);
    if (!mismaClase) continue;
    const c = grupo.map((x) => x.charCodeAt(0));
    const asc = c[1] - c[0] === 1 && c[2] - c[1] === 1 && c[3] - c[2] === 1;
    const desc = c[0] - c[1] === 1 && c[1] - c[2] === 1 && c[2] - c[3] === 1;
    if (asc || desc) return true;
  }
  return false;
}

function contieneComun(password) {
  const normal = normalizar(password);
  return PALABRAS_COMUNES.some((p) => normal.includes(p));
}

function contieneDatoPersonal(password, datos) {
  const normal = normalizar(password);
  return datos.filter(Boolean).some((dato) => {
    let base = normalizar(dato);
    const arroba = base.indexOf('@');
    if (arroba > 0) base = base.slice(0, arroba);
    const partes = base.split(/[^a-z0-9]+/).filter((p) => p.length >= 3);
    if (partes.some((p) => normal.includes(p))) return true;
    const compacto = base.replace(/[^a-z0-9]/g, '');
    return compacto.length >= 3 && normal.includes(compacto);
  });
}

export const REGLAS = [
  { id: 'longitud', texto: `Entre ${LONGITUD_MINIMA} y ${LONGITUD_MAXIMA} caracteres`, test: (p) => p.length >= LONGITUD_MINIMA && p.length <= LONGITUD_MAXIMA },
  { id: 'mayuscula', texto: 'Al menos una letra MAYÚSCULA', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'minuscula', texto: 'Al menos una letra minúscula', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'numero', texto: 'Al menos un número', test: (p) => /\d/.test(p) },
  { id: 'simbolo', texto: 'Al menos un símbolo (! # $ % & * @ ?)', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
  { id: 'espacios', texto: 'Sin espacios', test: (p) => p.length > 0 && !/\s/.test(p) },
  { id: 'repeticion', texto: 'Sin 3 caracteres iguales seguidos (aaa, 111)', test: (p) => p.length > 0 && !/(.)\1\1/u.test(p) },
  { id: 'secuencia', texto: 'Sin secuencias como 1234, abcd o 4321', test: (p) => p.length > 0 && !tieneSecuencia(p) },
  { id: 'comun', texto: 'Sin palabras comunes (password, qwerty, 123456, admin…)', test: (p) => p.length > 0 && !contieneComun(p) },
  { id: 'personal', texto: 'Sin tu nombre, usuario ni correo', test: (p, datos) => p.length > 0 && !contieneDatoPersonal(p, datos) },
];

export function evaluarPassword(password, datosPersonales = []) {
  const p = password || '';
  const reglas = REGLAS.map((r) => ({ id: r.id, texto: r.texto, cumple: r.test(p, datosPersonales) }));
  const cumplidas = reglas.filter((r) => r.cumple).length;
  const valida = cumplidas === reglas.length;
  let nivel = 'muy débil';
  if (valida && p.length >= 16) nivel = 'muy fuerte';
  else if (valida) nivel = 'fuerte';
  else if (cumplidas >= 7) nivel = 'media';
  else if (cumplidas >= 4) nivel = 'débil';
  return { reglas, valida, cumplidas, total: reglas.length, nivel };
}

/** Genera una contraseña aleatoria que cumple la política, usando el generador criptográfico del navegador. */
export function generarPasswordSegura(longitud = 18, datosPersonales = []) {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus = 'abcdefghijkmnpqrstuvwxyz';
  const nums = '23456789';
  const simbolos = '!#$%&*+-=?@^_';
  const todos = mayus + minus + nums + simbolos;
  const azar = (max) => {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  };
  for (let intento = 0; intento < 50; intento += 1) {
    const chars = [mayus, minus, nums, simbolos].map((g) => g[azar(g.length)]);
    while (chars.length < longitud) chars.push(todos[azar(todos.length)]);
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = azar(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const candidata = chars.join('');
    if (evaluarPassword(candidata, datosPersonales).valida) return candidata;
  }
  return 'Mq7#vT2!kR9@xW4$zP';
}
