import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ANCHOS = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

/** Diálogo accesible: Esc y clic fuera lo cierran, bloquea el scroll y devuelve el foco al cerrar. */
export function Modal({ abierto, onCerrar, titulo, descripcion, ancho = 'md', children, pie }) {
  const panel = useRef(null);
  const previo = useRef(null);
  // Se guarda en una ref para que re-renderizar el padre no reinicie el foco ni los listeners
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierto) return undefined;
    previo.current = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alTeclear = (e) => {
      if (e.key === 'Escape') cerrar.current();
      if (e.key === 'Tab' && panel.current) {
        const focos = panel.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
        if (focos.length === 0) return;
        const primero = focos[0];
        const ultimo = focos[focos.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', alTeclear);
    const id = setTimeout(() => {
      const campo = panel.current?.querySelector('[data-autofocus]') || panel.current;
      campo?.focus?.();
    }, 30);
    return () => {
      clearTimeout(id);
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflow;
      previo.current?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCerrar} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1}
        className={`relative w-full ${ANCHOS[ancho] || ANCHOS.md} max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl outline-none`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900">{titulo}</h2>
            {descripcion && <p className="text-sm text-slate-500 font-medium mt-0.5">{descripcion}</p>}
          </div>
          <button type="button" onClick={onCerrar} className="p-2 -mr-2 -mt-1 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {pie && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex flex-wrap justify-end gap-3">{pie}</div>}
      </div>
    </div>
  );
}

/** Confirmación para acciones delicadas (reemplaza a window.confirm). */
export function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false, cargando = false, onConfirmar, onCancelar }) {
  return (
    <Modal abierto={abierto} onCerrar={onCancelar} titulo={titulo} ancho="sm"
      pie={(
        <>
          <button type="button" onClick={onCancelar} className="px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-200 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button type="button" data-autofocus onClick={onConfirmar} disabled={cargando}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-sm text-white disabled:opacity-60 ${peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {cargando ? 'Procesando…' : textoConfirmar}
          </button>
        </>
      )}>
      <div className="flex gap-3">
        {peligro && (
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
          </div>
        )}
        <p className="text-sm text-slate-600 font-medium leading-relaxed">{mensaje}</p>
      </div>
    </Modal>
  );
}
