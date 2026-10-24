import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const ESTILOS = {
  error: { caja: 'bg-red-50 border-red-200 text-red-800', Icono: AlertTriangle },
  exito: { caja: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icono: CheckCircle2 },
  info: { caja: 'bg-indigo-50 border-indigo-200 text-indigo-800', Icono: Info },
  aviso: { caja: 'bg-amber-50 border-amber-200 text-amber-900', Icono: Info },
};

export default function Alerta({ tipo = 'info', children, detalles }) {
  if (!children) return null;
  const { caja, Icono } = ESTILOS[tipo] || ESTILOS.info;
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-start gap-2.5 ${caja}`}>
      <Icono className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p>{children}</p>
        {detalles?.length > 0 && (
          <ul className="mt-1.5 list-disc pl-5 font-medium space-y-0.5">
            {detalles.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
