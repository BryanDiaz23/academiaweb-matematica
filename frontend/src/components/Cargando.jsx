import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500 font-semibold text-sm" role="status">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}
