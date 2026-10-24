import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpCircle, Home, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WHATSAPP_NUMBER } from '../config';
import Logo from './Logo';
import { Avatar } from './ui/ui';

function Navegacion({ items, activo, onCambiar, alElegir }) {
  return (
    <nav aria-label="Secciones del panel" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {items.map(({ id, texto, Icono, cuenta, alerta }) => {
        const actual = id === activo;
        return (
          <button key={id} type="button" onClick={() => { onCambiar(id); alElegir?.(); }} aria-current={actual ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              actual ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}>
            <Icono className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">{texto}</span>
            {cuenta > 0 && (
              <span className={`min-w-[22px] text-center text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${
                actual ? 'bg-white/25 text-white' : alerta ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>{cuenta}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Estructura común del Aula y del Panel de administración:
 * barra lateral en escritorio, menú desplegable en móvil, cabecera de página.
 */
export default function PanelShell({ titulo, subtitulo, items, activo, onCambiar, rolEtiqueta, ayuda = false, acciones, children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    document.title = `${titulo} · Matemática Sin Estrés`;
  }, [titulo]);

  const salir = () => {
    logout();
    navigate('/login', { replace: true, state: { salio: true } });
  };

  const pie = (
    <div className="p-3 border-t border-slate-200 space-y-2">
      <div className="flex items-center gap-3 px-2 py-2">
        <Avatar nombre={usuario?.nombreCompleto} />
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-extrabold text-slate-900 truncate">{usuario?.nombreCompleto}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> {rolEtiqueta}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link to="/" className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
          <Home className="w-4 h-4" aria-hidden="true" /> Inicio
        </Link>
        <button type="button" onClick={salir} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold">
          <LogOut className="w-4 h-4" aria-hidden="true" /> Salir
        </button>
      </div>
      {ayuda && (
        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Necesito ayuda con mi Aula Virtual de Matemática Sin Estrés.')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold">
          <HelpCircle className="w-4 h-4" aria-hidden="true" /> ¿Necesitas ayuda? Escríbenos
        </a>
      )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 text-slate-800 lg:flex">
        {/* Barra lateral (escritorio) */}
        <aside className="no-imprimir hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200">
          <div className="h-20 px-5 flex items-center border-b border-slate-200"><Logo /></div>
          <Navegacion items={items} activo={activo} onCambiar={onCambiar} />
          {pie}
        </aside>

        {/* Barra superior (móvil) */}
        <header className="no-imprimir lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="px-4 h-16 flex items-center justify-between">
            <Logo />
            <button type="button" onClick={() => setMenuAbierto(true)} className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700" aria-label="Abrir menú" aria-expanded={menuAbierto}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {menuAbierto && (
          <div className="no-imprimir lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
            <div className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl">
              <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
                <span className="font-black text-slate-900">Menú</span>
                <button type="button" onClick={() => setMenuAbierto(false)} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Cerrar menú"><X className="w-5 h-5" /></button>
              </div>
              <Navegacion items={items} activo={activo} onCambiar={onCambiar} alElegir={() => setMenuAbierto(false)} />
              {pie}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
            <div className="no-imprimir mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{titulo}</h1>
                {subtitulo && <p className="text-slate-500 font-medium mt-1">{subtitulo}</p>}
              </div>
              {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
