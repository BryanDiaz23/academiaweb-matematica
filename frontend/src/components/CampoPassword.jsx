import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function CampoPassword({ id, label, value, onChange, placeholder, autoComplete, name, color = 'indigo', mostrar, onToggle }) {
  const [verLocal, setVerLocal] = useState(false);
  const visible = mostrar ?? verLocal;
  const alternar = onToggle ?? (() => setVerLocal((v) => !v));
  const foco = color === 'emerald'
    ? 'focus:border-emerald-500 focus:ring-emerald-500/10'
    : 'focus:border-indigo-500 focus:ring-indigo-500/10';

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
        {label}
      </label>
      <div className="relative">
        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          id={id}
          name={name || id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={128}
          className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 outline-none font-medium text-slate-800 transition-all ${foco}`}
        />
        <button
          type="button"
          onClick={alternar}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
