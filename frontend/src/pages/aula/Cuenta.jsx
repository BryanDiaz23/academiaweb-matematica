import React from 'react';
import { AtSign, CalendarDays, Clock, Mail, UserCircle } from 'lucide-react';
import { useDatos } from '../../hooks/useDatos';
import { formatearFecha, formatearFechaHora } from '../../utils/format';
import CambiarPassword from '../../components/CambiarPassword';
import { Avatar, Esqueleto, Tarjeta, TituloSeccion } from '../../components/ui/ui';
import { useAula } from './contexto';

function Dato({ icono: Icono, etiqueta, valor }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Icono className="w-4 h-4" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{etiqueta}</p>
        <p className="text-sm font-bold text-slate-900 break-words">{valor || '—'}</p>
      </div>
    </div>
  );
}

export default function Cuenta() {
  const { usuario, derivados } = useAula();
  const { datos } = useDatos('/api/auth/me');
  const perfil = datos && !Array.isArray(datos) ? datos : null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo-perfil">
        <TituloSeccion id="titulo-perfil" icono={UserCircle}>Mis datos</TituloSeccion>
        <Tarjeta className="p-6">
          {datos === null ? <Esqueleto className="h-28" /> : (
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-4 sm:w-64">
                <Avatar nombre={usuario?.nombreCompleto} tamano="lg" />
                <div className="min-w-0">
                  <p className="font-black text-slate-900 leading-tight">{usuario?.nombreCompleto}</p>
                  <p className="text-xs font-bold text-emerald-600 mt-1">{derivados.tieneActiva ? 'Matrícula activa' : 'Sin matrícula activa'}</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Dato icono={AtSign} etiqueta="Usuario" valor={perfil?.username || usuario?.username} />
                <Dato icono={Mail} etiqueta="Correo" valor={perfil?.email || usuario?.email} />
                <Dato icono={CalendarDays} etiqueta="Miembro desde" valor={perfil?.creadoEn ? formatearFecha(perfil.creadoEn.slice(0, 10)) : ''} />
                <Dato icono={Clock} etiqueta="Último acceso" valor={perfil?.ultimoAcceso ? formatearFechaHora(perfil.ultimoAcceso) : ''} />
              </div>
            </div>
          )}
        </Tarjeta>
      </section>
      <section aria-label="Seguridad de la cuenta">
        <CambiarPassword />
      </section>
    </div>
  );
}
