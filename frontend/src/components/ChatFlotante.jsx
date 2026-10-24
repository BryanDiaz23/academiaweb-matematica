import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { enlaceWhatsAppTexto } from '../config';
import { MENSAJE_BIENVENIDA, PREGUNTAS_SUGERIDAS, responder } from '../utils/chatbot';

// Botones que puede mostrar una respuesta. `href` interno = ancla de la página; `to` = ruta de React Router.
const BOTONES = {
  diagnostico: { texto: 'Pedir clase de diagnóstico', href: '#diagnostico' },
  niveles: { texto: 'Ver niveles y precios', href: '#niveles' },
  horarios: { texto: 'Ver horarios', href: '#horarios-precios' },
  registro: { texto: 'Crear mi cuenta', to: '/register' },
  apoderado: { texto: 'Crear cuenta de apoderado', to: '/register?tipo=apoderado' },
};

const MAX_CARACTERES = 200;
const RETRASO_RESPUESTA_MS = 350;

let contador = 0;
const nuevoId = () => `m${++contador}`;

/**
 * Asistente flotante de preguntas frecuentes. Reemplaza al botón de WhatsApp: responde al instante y,
 * cuando no sabe, deriva a WhatsApp con la pregunta ya escrita. Las respuestas viven en utils/chatbot.js.
 */
export default function ChatFlotante({ niveles = [], horarios = [] }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState(() => [
    { id: nuevoId(), de: 'bot', texto: MENSAJE_BIENVENIDA, acciones: [], sugerir: true },
  ]);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const finRef = useRef(null);
  const campoRef = useRef(null);
  const botonRef = useRef(null);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  // Mantiene visible el último mensaje.
  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView?.({ block: 'end' });
  }, [mensajes, escribiendo, abierto]);

  useEffect(() => {
    if (abierto) campoRef.current?.focus();
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    botonRef.current?.focus();
  };

  const alTeclear = (e) => {
    if (e.key === 'Escape') cerrar();
  };

  const preguntar = (pregunta) => {
    const limpia = pregunta.trim().slice(0, MAX_CARACTERES);
    if (!limpia || escribiendo) return;
    setMensajes((m) => [...m, { id: nuevoId(), de: 'yo', texto: limpia }]);
    setTexto('');
    setEscribiendo(true);
    temporizador.current = setTimeout(() => {
      const r = responder(limpia, { niveles, horarios });
      setMensajes((m) => [...m, { id: nuevoId(), de: 'bot', pregunta: limpia, ...r }]);
      setEscribiendo(false);
    }, RETRASO_RESPUESTA_MS);
  };

  const enviar = (e) => {
    e.preventDefault();
    preguntar(texto);
  };

  const claseBoton = 'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors';

  const renderAccion = (clave, pregunta) => {
    if (clave === 'whatsapp') {
      const mensaje = pregunta
        ? `¡Hola! Tengo una consulta sobre Matemática Sin Estrés: ${pregunta}`
        : '¡Hola! Quisiera información sobre Matemática Sin Estrés.';
      return (
        <a key={clave} href={enlaceWhatsAppTexto(mensaje)} target="_blank" rel="noopener noreferrer"
          className={`${claseBoton} border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600`}>
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Escribir por WhatsApp
        </a>
      );
    }
    const b = BOTONES[clave];
    if (!b) return null;
    const estilo = `${claseBoton} border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`;
    return b.to
      ? <Link key={clave} to={b.to} onClick={() => setAbierto(false)} className={estilo}>{b.texto}</Link>
      : <a key={clave} href={b.href} onClick={() => setAbierto(false)} className={estilo}>{b.texto}</a>;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6" onKeyDown={alTeclear}>
      {abierto && (
        <section
          role="dialog"
          aria-label="Asistente de preguntas frecuentes"
          className="mb-3 flex h-[min(32rem,calc(100vh-6.5rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold leading-tight">Asistente MSE</p>
                <p className="text-[11px] leading-tight text-indigo-100">Respuestas al instante</p>
              </div>
            </div>
            <button type="button" onClick={cerrar} aria-label="Cerrar el asistente"
              className="rounded-full p-1.5 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3" role="log" aria-live="polite" aria-label="Conversación">
            {mensajes.map((m) => (
              <div key={m.id} className={m.de === 'yo' ? 'flex justify-end' : 'flex justify-start'}>
                <div className="max-w-[85%] space-y-2">
                  <p className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.de === 'yo'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>
                    {m.texto}
                  </p>
                  {m.de === 'bot' && m.acciones?.length > 0 && (
                    <div className="flex flex-wrap gap-2">{m.acciones.map((a) => renderAccion(a, m.pregunta))}</div>
                  )}
                  {m.de === 'bot' && m.sugerir && (
                    <div className="flex flex-wrap gap-2">
                      {PREGUNTAS_SUGERIDAS.map((p) => (
                        <button key={p} type="button" onClick={() => preguntar(p)} disabled={escribiendo}
                          className="rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {escribiendo && (
              <p className="text-xs font-semibold text-slate-500" role="status">Escribiendo…</p>
            )}
            <div ref={finRef} />
          </div>

          <form onSubmit={enviar} className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5">
            <label htmlFor="chat-pregunta" className="sr-only">Escribe tu pregunta</label>
            <input id="chat-pregunta" ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)}
              maxLength={MAX_CARACTERES} autoComplete="off" placeholder="Escribe tu pregunta…"
              className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            <button type="submit" disabled={!texto.trim() || escribiendo} aria-label="Enviar pregunta"
              className="rounded-full bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      <div className="flex justify-end">
        <button ref={botonRef} type="button" onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto} aria-label={abierto ? 'Cerrar el asistente de preguntas frecuentes' : 'Abrir el asistente de preguntas frecuentes'}
          className="group flex items-center justify-center rounded-full bg-emerald-500 p-4 text-white shadow-2xl shadow-emerald-500/50 transition-all hover:scale-110 hover:bg-emerald-600">
          {abierto ? <X className="h-7 w-7" aria-hidden="true" /> : <MessageCircle className="h-7 w-7 fill-current" aria-hidden="true" />}
          {!abierto && (
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold transition-all duration-300 group-hover:ml-2 group-hover:max-w-xs group-focus-visible:ml-2 group-focus-visible:max-w-xs">
              ¿Dudas? ¡Pregúntanos!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
