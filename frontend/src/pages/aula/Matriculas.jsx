import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, GraduationCap, MessageCircle, Send, Tag } from 'lucide-react';
import { api } from '../../api/client';
import { enlaceWhatsAppTexto } from '../../config';
import { diasHasta, formatearFecha, formatearPrecio, hoyISO, textoDias } from '../../utils/format';
import Alerta from '../../components/Alerta';
import { useToast } from '../../components/ui/Toast';
import {
  BarraProgreso, BOTON_PRIMARIO, BOTON_SECUNDARIO, CLASE_ETIQUETA, CLASE_INPUT, EstadoVacio, Esqueleto, Insignia, Tarjeta, TituloSeccion,
  TONO_ESTADO_MATRICULA,
} from '../../components/ui/ui';
import { useAula } from './contexto';

const DIA_MS = 86400000;

function TarjetaMatricula({ m }) {
  const hoy = hoyISO();
  const vencida = m.estado === 'VENCIDA' || (m.estado === 'ACTIVA' && m.fechaFin && m.fechaFin < hoy);
  const estado = vencida ? 'VENCIDA' : m.estado;
  const restantes = m.fechaFin ? diasHasta(m.fechaFin) : null;
  let transcurrido = null;
  if (m.fechaInicio && m.fechaFin) {
    const inicio = new Date(`${m.fechaInicio}T00:00:00`);
    const fin = new Date(`${m.fechaFin}T00:00:00`);
    const total = Math.max(1, Math.round((fin - inicio) / DIA_MS));
    transcurrido = { total, usados: Math.min(total, Math.max(0, total - Math.max(0, restantes))) };
  }
  const urgente = estado === 'ACTIVA' && restantes !== null && restantes <= 7;
  const necesitaRenovar = estado === 'VENCIDA' || urgente;

  return (
    <Tarjeta className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {m.nivel}</p>
          <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
            <Clock className="w-4 h-4" aria-hidden="true" /> Turno {m.horario}
          </p>
        </div>
        <Insignia tono={TONO_ESTADO_MATRICULA[estado] || 'gris'} className="self-start text-xs">{estado}</Insignia>
      </div>

      {m.fechaInicio && m.fechaFin ? (
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> {formatearFecha(m.fechaInicio)} – {formatearFecha(m.fechaFin)}</span>
            {estado === 'ACTIVA' && <span className={urgente ? 'text-amber-600' : 'text-slate-500'}>{textoDias(restantes)}</span>}
          </div>
          <BarraProgreso valor={transcurrido.usados} max={transcurrido.total} tono={estado === 'VENCIDA' ? 'gris' : urgente ? 'ambar' : 'verde'} etiqueta="Tiempo transcurrido de la matrícula" />
        </div>
      ) : (
        <p className="text-sm font-medium text-slate-500">
          {estado === 'PENDIENTE' ? 'Pendiente de validación: la academia la activará al confirmar tu pago.' : 'Sin fechas registradas.'}
        </p>
      )}

      {necesitaRenovar && (
        <a href={enlaceWhatsAppTexto(`¡Hola! Quiero renovar mi matrícula de ${m.nivel} en Matemática Sin Estrés.`)} target="_blank" rel="noopener noreferrer" className={`${BOTON_SECUNDARIO} w-full sm:w-auto`}>
          <MessageCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Renovar por WhatsApp
        </a>
      )}
    </Tarjeta>
  );
}

export default function Matriculas() {
  const { matriculas, niveles, horarios, recargarMatriculas } = useAula();
  const toast = useToast();
  const [solicitud, setSolicitud] = useState({ nivelId: '', horarioId: '' });
  const [estado, setEstado] = useState({ cargando: false, error: '' });

  const ocupados = useMemo(
    () => new Set((matriculas || []).filter((m) => m.estado === 'PENDIENTE' || m.estado === 'ACTIVA').map((m) => m.nivelId)),
    [matriculas]
  );
  const nivelElegido = niveles.find((n) => String(n.id) === solicitud.nivelId);
  const horarioElegido = horarios.find((h) => String(h.id) === solicitud.horarioId);

  const enviar = async (e) => {
    e.preventDefault();
    if (!solicitud.nivelId || !solicitud.horarioId) {
      setEstado({ cargando: false, error: 'Elige un nivel y un horario.' });
      return;
    }
    setEstado({ cargando: true, error: '' });
    try {
      await api('/api/alumno/matriculas', {
        method: 'POST',
        body: { nivelId: Number(solicitud.nivelId), horarioId: Number(solicitud.horarioId) },
      });
      setSolicitud({ nivelId: '', horarioId: '' });
      setEstado({ cargando: false, error: '' });
      toast.exito('Solicitud enviada. Tu matrícula se activará cuando la academia confirme tu pago.');
      recargarMatriculas();
    } catch (err) {
      setEstado({ cargando: false, error: err.message });
    }
  };

  if (matriculas === null) {
    return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Esqueleto className="h-48 lg:col-span-2" /><Esqueleto className="h-72" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <section aria-labelledby="titulo-mis-matriculas" className="lg:col-span-2 space-y-4">
        <TituloSeccion id="titulo-mis-matriculas" icono={GraduationCap}>Historial de matrículas</TituloSeccion>
        {matriculas.length === 0 ? (
          <EstadoVacio icono={GraduationCap} titulo="Aún no tienes matrículas" texto="Solicita tu primera matrícula con el formulario y empieza a repasar sin estrés." />
        ) : (
          matriculas.map((m) => <TarjetaMatricula key={m.id} m={m} />)
        )}
      </section>

      <form onSubmit={enviar} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 lg:sticky lg:top-6">
        <h3 className="font-black text-slate-900 text-lg">Solicitar matrícula</h3>
        <Alerta tipo="error">{estado.error}</Alerta>
        <div>
          <label htmlFor="nivelId" className={CLASE_ETIQUETA}>Nivel</label>
          <select id="nivelId" value={solicitud.nivelId} onChange={(e) => setSolicitud({ ...solicitud, nivelId: e.target.value })} className={CLASE_INPUT}>
            <option value="">Selecciona…</option>
            {niveles.map((n) => (
              <option key={n.id} value={n.id} disabled={ocupados.has(n.id)}>
                {n.nombre} — S/ {formatearPrecio(n.precioMensual)}/mes{ocupados.has(n.id) ? ' (ya tienes una)' : ''}
              </option>
            ))}
          </select>
        </div>
        {nivelElegido && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2" aria-live="polite">
            <p className="text-sm font-bold text-slate-700">{nivelElegido.subtitulo}</p>
            {nivelElegido.rangoEdad && <p className="text-xs font-semibold text-slate-500">{nivelElegido.rangoEdad}</p>}
            <ul className="space-y-1">
              {nivelElegido.caracteristicas?.slice(0, 4).map((c) => (
                <li key={c} className="text-xs font-medium text-slate-600 flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" /> {c}</li>
              ))}
            </ul>
            <p className="text-sm font-black text-indigo-600 flex items-center gap-1.5"><Tag className="w-4 h-4" aria-hidden="true" /> S/ {formatearPrecio(nivelElegido.precioMensual)} al mes</p>
          </div>
        )}
        <div>
          <label htmlFor="horarioId" className={CLASE_ETIQUETA}>Horario</label>
          <select id="horarioId" value={solicitud.horarioId} onChange={(e) => setSolicitud({ ...solicitud, horarioId: e.target.value })} className={CLASE_INPUT}>
            <option value="">Selecciona…</option>
            {horarios.map((h) => (
              <option key={h.id} value={h.id}>{h.turno} ({h.horaInicio} – {h.horaFin})</option>
            ))}
          </select>
          {horarioElegido && <p className="text-xs font-semibold text-slate-500 mt-1.5">{horarioElegido.dias}</p>}
        </div>
        <button type="submit" disabled={estado.cargando} className={`${BOTON_PRIMARIO} w-full py-3`}>
          <Send className="w-4 h-4" aria-hidden="true" /> {estado.cargando ? 'Enviando…' : 'Enviar solicitud'}
        </button>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">Tu matrícula quedará <strong>pendiente</strong> hasta que la academia confirme tu pago; recién entonces se desbloquean las clases.</p>
      </form>
    </div>
  );
}
