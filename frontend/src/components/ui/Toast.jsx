import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  exito: { caja: 'border-emerald-200 bg-white', icono: 'text-emerald-600', Icono: CheckCircle2 },
  error: { caja: 'border-red-200 bg-white', icono: 'text-red-600', Icono: AlertTriangle },
  info: { caja: 'border-indigo-200 bg-white', icono: 'text-indigo-600', Icono: Info },
};

/** Avisos flotantes que desaparecen solos. Uso: const toast = useToast(); toast.exito('Guardado'). */
export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const contador = useRef(0);

  const quitar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const mostrar = useCallback((tipo, texto, duracion = 4500) => {
    contador.current += 1;
    const id = contador.current;
    setAvisos((lista) => [...lista.slice(-3), { id, tipo, texto }]);
    if (duracion > 0) setTimeout(() => quitar(id), duracion);
  }, [quitar]);

  const api = useMemo(() => ({
    exito: (t) => mostrar('exito', t),
    error: (t) => mostrar('error', t, 7000),
    info: (t) => mostrar('info', t),
  }), [mostrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {avisos.map((a) => {
          const { caja, icono, Icono } = ESTILOS[a.tipo] || ESTILOS.info;
          return (
            <div key={a.id} role={a.tipo === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-lg shadow-slate-900/10 p-4 ${caja}`}>
              <Icono className={`w-5 h-5 shrink-0 mt-0.5 ${icono}`} aria-hidden="true" />
              <p className="flex-1 text-sm font-semibold text-slate-800">{a.texto}</p>
              <button type="button" onClick={() => quitar(a.id)} className="p-0.5 rounded-md text-slate-400 hover:text-slate-700" aria-label="Cerrar aviso">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

const SIN_TOAST = { exito: () => {}, error: () => {}, info: () => {} };

export function useToast() {
  return useContext(ToastContext) || SIN_TOAST;
}

