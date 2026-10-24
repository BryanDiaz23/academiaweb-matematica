import React from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { iniciales } from '../../utils/format';

// ---------------------------------------------------------------- Tonos de color (clases completas para Tailwind)
export const TONOS = {
  verde: { insignia: 'bg-emerald-100 text-emerald-800 border-emerald-200', icono: 'bg-emerald-50 text-emerald-600', barra: 'bg-emerald-500', texto: 'text-emerald-600', hex: '#10b981' },
  ambar: { insignia: 'bg-amber-100 text-amber-800 border-amber-200', icono: 'bg-amber-50 text-amber-600', barra: 'bg-amber-500', texto: 'text-amber-600', hex: '#f59e0b' },
  rojo: { insignia: 'bg-red-100 text-red-700 border-red-200', icono: 'bg-red-50 text-red-600', barra: 'bg-red-500', texto: 'text-red-600', hex: '#ef4444' },
  gris: { insignia: 'bg-slate-100 text-slate-700 border-slate-200', icono: 'bg-slate-100 text-slate-600', barra: 'bg-slate-400', texto: 'text-slate-600', hex: '#94a3b8' },
  indigo: { insignia: 'bg-indigo-100 text-indigo-800 border-indigo-200', icono: 'bg-indigo-50 text-indigo-600', barra: 'bg-indigo-600', texto: 'text-indigo-600', hex: '#4f46e5' },
  violeta: { insignia: 'bg-violet-100 text-violet-800 border-violet-200', icono: 'bg-violet-50 text-violet-600', barra: 'bg-violet-600', texto: 'text-violet-600', hex: '#7c3aed' },
  azul: { insignia: 'bg-sky-100 text-sky-800 border-sky-200', icono: 'bg-sky-50 text-sky-600', barra: 'bg-sky-500', texto: 'text-sky-600', hex: '#0ea5e9' },
  rosa: { insignia: 'bg-pink-100 text-pink-800 border-pink-200', icono: 'bg-pink-50 text-pink-600', barra: 'bg-pink-500', texto: 'text-pink-600', hex: '#ec4899' },
  naranja: { insignia: 'bg-orange-100 text-orange-800 border-orange-200', icono: 'bg-orange-50 text-orange-600', barra: 'bg-orange-500', texto: 'text-orange-600', hex: '#f97316' },
};

export const TONO_NIVEL = { PRIMARIA: 'verde', SECUNDARIA: 'indigo', PRE: 'violeta' };
export const TONO_ESTADO_MATRICULA = { ACTIVA: 'verde', PENDIENTE: 'ambar', VENCIDA: 'gris', ANULADA: 'rojo' };

// ---------------------------------------------------------------- Elementos básicos
export function Insignia({ tono = 'gris', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border whitespace-nowrap ${(TONOS[tono] || TONOS.gris).insignia} ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({ nombre, tamano = 'md', tono = 'indigo' }) {
  const medidas = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  return (
    <span aria-hidden="true" className={`${medidas[tamano] || medidas.md} shrink-0 rounded-full inline-flex items-center justify-center font-black ${(TONOS[tono] || TONOS.indigo).icono} border border-white shadow-sm`}>
      {iniciales(nombre)}
    </span>
  );
}

export function Tarjeta({ children, className = '', ...resto }) {
  return <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`} {...resto}>{children}</div>;
}

export function TituloSeccion({ icono: Icono, children, accion, id }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 id={id} className="text-lg font-black text-slate-900 flex items-center gap-2">
        {Icono && <Icono className="w-5 h-5 text-indigo-600" aria-hidden="true" />}
        {children}
      </h2>
      {accion}
    </div>
  );
}

export function Esqueleto({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

export function EstadoVacio({ icono: Icono, titulo, texto, children }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-3xl px-6 py-10 text-center">
      {Icono && (
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Icono className="w-6 h-6 text-slate-400" aria-hidden="true" />
        </div>
      )}
      <p className="font-extrabold text-slate-800">{titulo}</p>
      {texto && <p className="text-sm text-slate-500 font-medium mt-1 max-w-md mx-auto">{texto}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  );
}

/** Tarjeta de indicador (KPI). Si recibe `onClick` se comporta como botón. */
export function StatCard({ icono: Icono, etiqueta, valor, nota, tono = 'indigo', onClick }) {
  const t = TONOS[tono] || TONOS.indigo;
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{etiqueta}</p>
          <p className="text-3xl font-black text-slate-900 mt-1 truncate">{valor}</p>
        </div>
        {Icono && (
          <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${t.icono}`}>
            <Icono className="w-5 h-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {nota && <p className="text-xs font-semibold text-slate-500 mt-2">{nota}</p>}
    </>
  );
  const base = 'text-left p-5 rounded-2xl bg-white border border-slate-200 shadow-sm w-full';
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} hover:border-indigo-300 hover:shadow-md transition-all`}>
        {contenido}
      </button>
    );
  }
  return <div className={base}>{contenido}</div>;
}

export function BarraProgreso({ valor, max = 100, tono = 'indigo', etiqueta, alto = 'h-2.5' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((valor / max) * 100))) : 0;
  return (
    <div className={`w-full ${alto} rounded-full bg-slate-100 overflow-hidden`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={etiqueta}>
      <div className={`${alto} rounded-full transition-all duration-500 ${(TONOS[tono] || TONOS.indigo).barra}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Anillo de progreso con porcentaje al centro. */
export function Anillo({ valor, tamano = 112, grosor = 11, tono = 'indigo', etiqueta }) {
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const pct = Math.min(100, Math.max(0, valor));
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }} role="img" aria-label={`${etiqueta || 'Progreso'}: ${pct}%`}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke="#e2e8f0" strokeWidth={grosor} />
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none" stroke={(TONOS[tono] || TONOS.indigo).hex} strokeWidth={grosor}
          strokeLinecap="round" strokeDasharray={circunferencia} strokeDashoffset={circunferencia * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-900">{pct}%</span>
    </div>
  );
}

// ---------------------------------------------------------------- Controles de formulario y filtros
export function CampoBusqueda({ id = 'buscar', valor, onCambiar, placeholder = 'Buscar…', className = '' }) {
  return (
    <div className={`relative ${className}`} role="search">
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <input id={id} type="search" value={valor} onChange={(e) => onCambiar(e.target.value)} placeholder={placeholder} maxLength={80}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" />
      {valor && (
        <button type="button" onClick={() => onCambiar('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700" aria-label="Limpiar búsqueda">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Selector({ id, etiqueta, valor, onCambiar, children, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <select id={id} value={valor} onChange={(e) => onCambiar(e.target.value)} title={etiqueta}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none">
        {children}
      </select>
    </div>
  );
}

/** Botones tipo "píldora" para filtrar por estado. opciones: [{ id, texto, cuenta? }] */
export function Chips({ opciones, valor, onCambiar, etiqueta }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={etiqueta}>
      {opciones.map((o) => {
        const activo = o.id === valor;
        return (
          <button key={o.id} type="button" onClick={() => onCambiar(o.id)} aria-pressed={activo}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors ${
              activo ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {o.texto}
            {o.cuenta !== undefined && (
              <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${activo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{o.cuenta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Interruptor({ activo, onCambiar, etiqueta, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} title={etiqueta} disabled={disabled} onClick={() => onCambiar(!activo)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${activo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export const CLASE_INPUT = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none';
export const CLASE_ETIQUETA = 'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5';

export const BOTON_PRIMARIO = 'inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 transition-colors';
export const BOTON_SECUNDARIO = 'inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl border border-slate-200 transition-colors';

// ---------------------------------------------------------------- Paginación
export function Paginacion({ pagina, total, porPagina, onPagina, onPorPagina, opciones = [10, 25, 50] }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-sm">
      <p className="font-semibold text-slate-500">Mostrando {desde}–{hasta} de {total}</p>
      <div className="flex items-center gap-3">
        {onPorPagina && (
          <>
            <label htmlFor="por-pagina" className="sr-only">Filas por página</label>
            <select id="por-pagina" value={porPagina} onChange={(e) => onPorPagina(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700">
              {opciones.map((o) => <option key={o} value={o}>{o} por página</option>)}
            </select>
          </>
        )}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1}
            className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50" aria-label="Página anterior">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-slate-700">{pagina} / {paginas}</span>
          <button type="button" onClick={() => onPagina(pagina + 1)} disabled={pagina >= paginas}
            className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50" aria-label="Página siguiente">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
