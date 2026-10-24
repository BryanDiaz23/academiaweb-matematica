import React from 'react';
import { CalendarPlus, Clock, Moon, Sun, Sunset } from 'lucide-react';
import { crearICS, describirProxima, proximaClase } from '../../utils/horarios';
import { descargarArchivo } from '../../utils/descarga';
import { BOTON_SECUNDARIO, EstadoVacio, Esqueleto, Insignia, Tarjeta } from '../../components/ui/ui';
import { useToast } from '../../components/ui/Toast';
import { useAula } from './contexto';

const ICONO_TURNO = {
  Mañana: { Icono: Sun, caja: 'bg-amber-50 text-amber-600' },
  Tarde: { Icono: Sunset, caja: 'bg-orange-50 text-orange-600' },
  Noche: { Icono: Moon, caja: 'bg-indigo-50 text-indigo-600' },
};

export default function Horarios() {
  const { horarios, matriculas, derivados } = useAula();
  const toast = useToast();

  if (matriculas === null) return <Esqueleto className="h-56" />;
  if (horarios.length === 0) {
    return <EstadoVacio icono={Clock} titulo="Horarios no disponibles" texto="No pudimos cargar los turnos. Intenta de nuevo en unos segundos." />;
  }

  const vigentesPorHorario = new Map();
  derivados.activas.forEach((m) => vigentesPorHorario.set(m.horarioId, m));
  const pendientesPorHorario = new Map();
  derivados.pendientes.forEach((m) => pendientesPorHorario.set(m.horarioId, m));

  const agregarCalendario = (h) => {
    const ics = crearICS(h, vigentesPorHorario.get(h.id)?.nivel);
    if (!ics) {
      toast.error('No pudimos interpretar los días de este turno para crear el recordatorio.');
      return;
    }
    descargarArchivo(`clase-en-vivo-${h.turno.toLowerCase()}.ics`, ics, 'text/calendar;charset=utf-8');
    toast.exito('Listo: abre el archivo para añadir la clase a tu calendario con aviso 15 minutos antes.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {horarios.map((h) => {
          const { Icono, caja } = ICONO_TURNO[h.turno] || { Icono: Clock, caja: 'bg-slate-100 text-slate-600' };
          const propio = vigentesPorHorario.get(h.id);
          const pendiente = pendientesPorHorario.get(h.id);
          const prox = proximaClase(h);
          return (
            <Tarjeta key={h.id} className={`p-6 flex flex-col gap-4 ${propio ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${caja}`}><Icono className="w-6 h-6" aria-hidden="true" /></span>
                {propio && <Insignia tono="verde">Tu turno</Insignia>}
                {!propio && pendiente && <Insignia tono="ambar">Solicitado</Insignia>}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Turno {h.turno}</h3>
                <p className="text-2xl font-black text-indigo-600 mt-1">{h.horaInicio} – {h.horaFin}</p>
                <p className="text-sm font-semibold text-slate-500 mt-1">{h.dias}</p>
              </div>
              {prox && (
                <p className={`text-sm font-bold ${prox.enCurso ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {prox.enCurso ? '🔴 ' : 'Próxima: '}{describirProxima(prox)}
                </p>
              )}
              <button type="button" onClick={() => agregarCalendario(h)} className={`${BOTON_SECUNDARIO} mt-auto`}>
                <CalendarPlus className="w-4 h-4" aria-hidden="true" /> Agregar al calendario
              </button>
            </Tarjeta>
          );
        })}
      </div>
      <p className="text-xs font-medium text-slate-500">Horarios de Lima (GMT-5). El recordatorio del calendario se repite cada semana y avisa 15 minutos antes de empezar.</p>
    </div>
  );
}
