import React from 'react';
import { CheckCircle2, Circle, ShieldCheck } from 'lucide-react';

const COLOR_NIVEL = {
  'muy débil': { barra: 'bg-red-500', texto: 'text-red-600' },
  'débil': { barra: 'bg-orange-500', texto: 'text-orange-600' },
  media: { barra: 'bg-amber-500', texto: 'text-amber-600' },
  fuerte: { barra: 'bg-emerald-500', texto: 'text-emerald-600' },
  'muy fuerte': { barra: 'bg-emerald-600', texto: 'text-emerald-700' },
};

/** Muestra en tiempo real qué reglas de la política de contraseñas se cumplen. */
export default function PasswordChecklist({ evaluacion, visible }) {
  if (!visible) return null;
  const { reglas, cumplidas, total, nivel, valida } = evaluacion;
  const color = COLOR_NIVEL[nivel] || COLOR_NIVEL['muy débil'];
  const porcentaje = Math.round((cumplidas / total) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-live="polite">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Seguridad de la contraseña
        </span>
        <span className={`text-xs font-extrabold uppercase ${color.texto}`}>{nivel}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-3">
        <div className={`h-full ${color.barra} transition-all duration-300`} style={{ width: `${porcentaje}%` }} />
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {reglas.map((r) => (
          <li key={r.id} className={`flex items-start gap-1.5 text-xs font-semibold ${r.cumple ? 'text-emerald-700' : 'text-slate-500'}`}>
            {r.cumple
              ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" aria-hidden="true" />
              : <Circle className="w-4 h-4 shrink-0 text-slate-300" aria-hidden="true" />}
            <span>{r.texto}<span className="sr-only">{r.cumple ? ' (cumple)' : ' (pendiente)'}</span></span>
          </li>
        ))}
      </ul>
      {!valida && (
        <p className="mt-3 text-[11px] text-slate-500 font-medium">
          Por tu seguridad no se aceptan contraseñas fáciles. Usa una frase o el generador automático.
        </p>
      )}
    </div>
  );
}
