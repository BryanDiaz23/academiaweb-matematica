import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', to = '/' }) {
  const caja = size === 'lg' ? 'w-11 h-11 text-2xl' : 'w-10 h-10 text-xl';
  const titulo = size === 'lg' ? 'text-xl' : 'text-lg';
  return (
    <Link to={to} className="flex items-center space-x-3 select-none" aria-label="Matemática Sin Estrés - inicio">
      <div className={`${caja} rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/30`}>
        M
      </div>
      <div>
        <span className={`${titulo} font-black tracking-tight text-slate-900 block leading-none`}>
          Matemática <span className="text-indigo-600">Sin Estrés</span>
        </span>
        <span className="text-[10px] text-emerald-600 tracking-wider font-extrabold uppercase mt-1 block">
          Academia Virtual
        </span>
      </div>
    </Link>
  );
}
