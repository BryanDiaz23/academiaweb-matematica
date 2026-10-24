// Lógica del asistente de preguntas frecuentes (sin IA, sin servidor, sin costo).
//
// Cómo funciona: se normaliza lo que escribe la persona (minúsculas, sin tildes), se buscan palabras clave y
// gana la intención con más puntos. Los precios y horarios se leen de los datos que ya trae la página desde la
// API (/api/public/niveles y /horarios), así que si cambian en la base de datos el chat responde con los nuevos.
//
// PARA EDITAR LAS RESPUESTAS: modifica el objeto RESPUESTAS (más abajo) o añade palabras en INTENCIONES.
// Esta función es pura (no usa React), por eso se puede probar con `npm test`.
//
// Las importaciones llevan la extensión .js para que Node pueda ejecutar las pruebas; Vite las acepta igual.
import { formatearPrecio, normalizar } from './format.js';

/** Botones de preguntas rápidas que ve la persona al abrir el chat. */
export const PREGUNTAS_SUGERIDAS = [
  '¿Cuánto cuestan los niveles?',
  '¿Qué horarios hay?',
  '¿Cómo me matriculo?',
  '¿Cómo pago?',
  '¿Cómo es la clase de diagnóstico?',
  '¿Y si no puedo asistir a la clase?',
];

export const MENSAJE_BIENVENIDA =
  '¡Hola! Soy el asistente de Matemática Sin Estrés. Elige una pregunta o escribe la tuya y te respondo al instante.';

/**
 * Palabras clave por intención. `fuertes` suman 2 puntos y `debiles` 1.
 * Una palabra de 5 letras o más coincide también como prefijo ("horario" acepta "horarios");
 * las más cortas deben coincidir exacto (así "pre" no se confunde con "precio").
 * Si contiene un espacio se busca como frase. El orden decide los empates.
 */
const INTENCIONES = [
  { id: 'renovacion',
    fuertes: ['renovar', 'renovacion', 'vence', 'vencimiento', 'vigencia', 'vencida'],
    debiles: ['mes', 'mensual'] },
  { id: 'pago',
    fuertes: ['pago', 'pagar', 'pagos', 'yape', 'plin', 'deposito', 'transferencia', 'medios de pago'],
    debiles: ['boleta', 'factura', 'comprobante'] },
  { id: 'matricula',
    fuertes: ['matricul', 'inscribir', 'inscribirme', 'inscripcion', 'registro', 'registrarme', 'crear cuenta', 'como empiezo'],
    debiles: ['cuenta', 'empezar', 'ingresar', 'vacante'] },
  { id: 'precios',
    fuertes: ['precio', 'precios', 'costo', 'cuesta', 'tarifa', 'mensualidad', 'cobran', 'pension'],
    debiles: ['cuanto', 'barato', 'caro'] },
  { id: 'horarios',
    fuertes: ['horario', 'horarios', 'turno', 'turnos', 'hora', 'horas', 'a que hora'],
    debiles: ['cuando', 'dias', 'dura', 'duran', 'tarde', 'noche'] },
  { id: 'diagnostico',
    fuertes: ['diagnostico', 'gratis', 'gratuita', 'gratuito', 'clase de prueba'],
    debiles: ['prueba', 'probar', 'demo'] },
  { id: 'grabadas',
    fuertes: ['grabada', 'grabadas', 'grabacion', 'grabaciones', 'repetir', 'no puedo asistir', 'no puedo conectarme', 'perdi la clase'],
    debiles: ['falto', 'faltar', 'repaso', 'repasar', 'replay', 'perder'] },
  { id: 'niveles',
    fuertes: ['nivel', 'niveles', 'primaria', 'secundaria', 'preuniversitario', 'universidad', 'admision', 'grado', 'edad'],
    debiles: ['pre', 'colegio', 'hijo', 'hija', 'ciclo cero'] },
  { id: 'metodo',
    fuertes: ['metodo', 'metodologia', 'profesor', 'docente', 'en vivo', 'ensenan', 'ensenanza', 'como son las clases'],
    debiles: ['clases', 'aprender'] },
  { id: 'acceso',
    fuertes: ['contrasena', 'clave', 'password', 'olvide', 'login', 'iniciar sesion', 'no puedo entrar'],
    debiles: ['entrar', 'sesion'] },
  { id: 'padres',
    fuertes: ['apoderado', 'apoderada', 'padres', 'padre', 'madre', 'papa', 'mama', 'familia', 'progreso', 'avance', 'rendimiento', 'como va mi hijo', 'como va mi hija'],
    debiles: ['notas', 'supervisar', 'controlar'] },
  { id: 'contacto',
    fuertes: ['whatsapp', 'asesor', 'asesora', 'hablar con', 'persona', 'humano', 'llamar', 'telefono', 'contacto', 'contactar'],
    debiles: ['celular', 'numero'] },
];

const SALUDOS = ['hola', 'buenas', 'buenos', 'saludos', 'hey', 'ola', 'buen dia'];

/** Botones que acompañan cada respuesta. La página decide a dónde lleva cada uno. */
const ACCIONES = {
  renovacion: ['whatsapp'],
  pago: ['whatsapp'],
  matricula: ['registro', 'whatsapp'],
  precios: ['niveles', 'registro'],
  horarios: ['registro', 'whatsapp'],
  diagnostico: ['diagnostico'],
  grabadas: ['registro'],
  niveles: ['niveles'],
  metodo: ['diagnostico'],
  acceso: ['whatsapp'],
  padres: ['apoderado', 'whatsapp'],
  contacto: ['whatsapp'],
  fallback: ['whatsapp'],
  saludo: [],
  vacio: [],
};

function hora12(hhmm) {
  const [h, m] = String(hhmm ?? '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(hhmm ?? '');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
}

const tokenizar = (textoNormalizado) => textoNormalizado.split(/[^a-z0-9]+/).filter(Boolean);

function coincide(kw, texto, tokens) {
  if (kw.includes(' ')) return texto.includes(kw);
  return tokens.some((t) => t === kw || (kw.length >= 5 && t.startsWith(kw)));
}

function puntuar(texto, tokens) {
  let mejor = null;
  for (const intencion of INTENCIONES) {
    // Cada palabra de la persona cuenta una sola vez por intención (aunque dos palabras clave coincidan con ella).
    const usadas = new Set();
    let puntos = 0;
    const palabras = [...intencion.fuertes.map((kw) => [kw, 2]), ...intencion.debiles.map((kw) => [kw, 1])];
    for (const [kw, peso] of palabras) {
      if (kw.includes(' ')) {
        if (!usadas.has(kw) && texto.includes(kw)) { usadas.add(kw); puntos += peso; }
        continue;
      }
      const i = tokens.findIndex((t, pos) => !usadas.has(pos) && coincide(kw, texto, [t]));
      if (i >= 0) { usadas.add(i); puntos += peso; }
    }
    if (puntos > 0 && (!mejor || puntos > mejor.puntos)) mejor = { id: intencion.id, puntos };
  }
  return mejor;
}

/** Niveles que la persona nombró ("secundaria", "pre"...). Si no nombra ninguno, devuelve todos. */
function nivelesMencionados(niveles, tokens) {
  const ignorar = new Set(['nivel', 'niveles']);
  const filtrados = niveles.filter((n) => {
    const codigo = normalizar(n.codigo);
    const nombre = normalizar(n.nombre);
    return tokens.some((t) => t === codigo || (t.length >= 5 && !ignorar.has(t) && nombre.includes(t)));
  });
  return filtrados.length ? filtrados : niveles;
}

const listaNiveles = (niveles) =>
  niveles.map((n) => `• ${n.nombre}${n.rangoEdad ? ` (${n.rangoEdad})` : ''}: S/ ${formatearPrecio(n.precioMensual)} al mes`).join('\n');

const listaHorarios = (horarios) =>
  horarios.map((h) => `• ${h.turno}: ${hora12(h.horaInicio)} a ${hora12(h.horaFin)}${h.dias ? `, ${h.dias}` : ''}`).join('\n');

/** Textos de cada respuesta. Edítalos con libertad: solo deben devolver un string. */
const RESPUESTAS = {
  precios: ({ niveles, tokens }) => {
    if (!niveles.length) return 'Los precios están en la sección "Niveles". Si prefieres, te los confirmamos por WhatsApp.';
    const lista = nivelesMencionados(niveles, tokens);
    return `Estas son las mensualidades:\n${listaNiveles(lista)}\n\nSe paga por mes, sin pago de matrícula.`;
  },
  horarios: ({ horarios }) => {
    if (!horarios.length) return 'Los horarios están en la sección "Horarios y precios". Si prefieres, te los confirmamos por WhatsApp.';
    return `Tenemos clases en vivo en estos turnos:\n${listaHorarios(horarios)}\n\nTodas las clases quedan grabadas para que las repases.`;
  },
  matricula: () =>
    'Es muy sencillo:\n1. Crea tu cuenta con una contraseña segura.\n2. Solicita tu matrícula eligiendo nivel y turno.\n3. La academia valida tu pago y activa tu matrícula por un mes.\n4. Entra a tu Aula Virtual y aprende 24/7.',
  pago: () =>
    'Primero solicitas tu matrícula desde tu cuenta. Luego la academia valida tu pago y activa tu acceso por un mes. Los medios de pago y los datos para depositar te los confirmamos por WhatsApp.',
  diagnostico: () =>
    'La clase de diagnóstico es gratuita. Sirve para conocer el nivel del alumno y recomendar el plan adecuado. Déjanos tu nombre y celular en el formulario y te contactamos.',
  grabadas: () =>
    'No te preocupes: las clases quedan grabadas en HD y las ves cuantas veces quieras desde tu Aula Virtual, mientras tu matrícula esté vigente. Para entrar necesitas tener tu cuenta creada.',
  niveles: ({ niveles }) => {
    if (!niveles.length) return 'Atendemos Primaria, Secundaria y Preuniversitario. Mira los detalles en la sección "Niveles".';
    return `Atendemos estos niveles:\n${niveles.map((n) => `• ${n.nombre}${n.rangoEdad ? ` (${n.rangoEdad})` : ''}${n.subtitulo ? `: ${n.subtitulo}` : ''}`).join('\n')}`;
  },
  renovacion: () =>
    'Tu matrícula dura un mes. Cuando vence, se cierra el acceso a las clases. Para renovarla, escríbenos por WhatsApp y la academia la reactiva al validar tu pago.',
  metodo: () =>
    'Las clases son en vivo y quedan grabadas en HD. Usamos un método 100 % práctico: menos teoría y más resolución guiada de ejercicios reales, con atención por WhatsApp para tus dudas.',
  acceso: () =>
    'Si ya tienes sesión, cambia tu contraseña en tu Aula, sección "Mi cuenta". Si la olvidaste, escríbenos por WhatsApp y la academia te genera una contraseña temporal.',
  padres: () =>
    'Los padres pueden crear una cuenta de apoderado (al registrarte elige "Soy padre, madre o apoderado"). La academia la vincula con tu hijo o hija y, desde tu panel, ves sus clases vistas, su avance semanal y la vigencia de su matrícula. Por seguridad, solo la academia puede hacer esa vinculación: escríbenos con el nombre de tu hijo o hija.',
  contacto: () => 'Claro, una persona de la academia te atiende por WhatsApp. Toca el botón de abajo.',
  saludo: () => '¡Hola! ¿En qué puedo ayudarte? Elige una pregunta o escribe la tuya.',
  vacio: () => 'Escribe tu pregunta o elige una de las sugeridas.',
  fallback: () => 'No tengo una respuesta exacta para eso, pero una persona de la academia puede ayudarte por WhatsApp.',
};

/**
 * Responde a una pregunta.
 * @param {string} entrada texto de la persona
 * @param {{niveles?: object[], horarios?: object[]}} datos niveles y horarios que ya trae la página
 * @returns {{id: string, texto: string, acciones: string[], sugerir: boolean}}
 *   `acciones` son botones (diagnostico | registro | niveles | apoderado | whatsapp); `sugerir` pide mostrar las preguntas rápidas.
 */
export function responder(entrada, datos = {}) {
  const niveles = Array.isArray(datos.niveles) ? datos.niveles : [];
  const horarios = Array.isArray(datos.horarios) ? datos.horarios : [];

  let texto = normalizar(entrada).replace(/buen(o|a)s\s+(dias|tardes|noches)/g, ' ').trim();
  if (!texto) {
    const id = String(entrada ?? '').trim() ? 'saludo' : 'vacio';
    return armar(id, { niveles, horarios, tokens: [] });
  }
  const tokens = tokenizar(texto);
  const ganadora = puntuar(texto, tokens);
  if (ganadora) return armar(ganadora.id, { niveles, horarios, tokens });
  if (tokens.some((t) => SALUDOS.includes(t))) return armar('saludo', { niveles, horarios, tokens });
  return armar('fallback', { niveles, horarios, tokens });
}

function armar(id, contexto) {
  return {
    id,
    texto: RESPUESTAS[id](contexto),
    acciones: ACCIONES[id] ?? [],
    sugerir: id === 'saludo' || id === 'fallback' || id === 'vacio',
  };
}
