import React, { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Circle, Clock, Download, FileText, GraduationCap, MessageCircle, TrendingUp } from 'lucide-react';
import { enlaceWhatsAppTexto } from '../../config';
import { descargarCSV } from '../../utils/descarga';
import { formatearDuracion, formatearFecha, formatearFechaHora, hoyISO } from '../../utils/format';
import {
  alertasAvance, COLUMNAS_INFORME, describirEstado, estadoMatriculaEfectivo, etiquetaParentesco, mensajeWhatsApp,
  nombreArchivoInforme, serieSemanal, textoActividad, textoVigencia, totalSemanas,
} from '../../utils/avance';
import {
  Anillo, Avatar, BarraProgreso, BOTON_PRIMARIO, BOTON_SECUNDARIO, Chips, EstadoVacio, Insignia, StatCard, Tarjeta,
  TituloSeccion, TONO_ESTADO_MATRICULA, TONO_NIVEL,
} from '../ui/ui';
import { BarrasVerticales } from '../ui/Graficos';

const ESTILO_AVISO = {
  aviso: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  exito: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

/**
 * Informe de avance de un alumno. Lo usan el padre (modo "familia") y el administrador (modo "admin").
 * El servidor no envía enlaces de video: aquí solo se ve el avance, no el contenido de las clases.
 */
export default function InformeAvance({ avance, modo = 'familia' }) {
  const [filtroClases, setFiltroClases] = useState('TODAS');
  const hoy = hoyISO();
  const estado = describirEstado(avance.estado);
  const avisos = useMemo(() => alertasAvance(avance), [avance]);
  const clases = avance.clases || [];
  const vistas = clases.filter((c) => c.vista).length;
  const visibles = clases.filter((c) => (filtroClases === 'VISTAS' ? c.vista : filtroClases === 'PENDIENTES' ? !c.vista : true));
  const enFamilia = modo === 'familia';
  const datosHijo = { nombre: avance.nombre, username: avance.username };

  const bajarCSV = () => {
    descargarCSV(nombreArchivoInforme(avance, hoy), COLUMNAS_INFORME, clases);
  };

  const accionAviso = (tipo) => (
    <a href={enlaceWhatsAppTexto(mensajeWhatsApp(tipo === 'renovar' ? 'renovar' : 'contacto', datosHijo))} target="_blank" rel="noopener noreferrer"
      className={`${BOTON_SECUNDARIO} no-imprimir shrink-0`}>
      <MessageCircle className="w-4 h-4" aria-hidden="true" /> {tipo === 'renovar' ? 'Renovar matrícula' : 'Hablar con la academia'}
    </a>
  );

  return (
    <div className="space-y-8">
      {/* Cabecera que solo aparece al imprimir */}
      <div className="solo-imprimir">
        <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">Matemática Sin Estrés</p>
        <h2 className="text-2xl font-black text-slate-900">Informe de avance</h2>
        <p className="text-sm font-semibold text-slate-600">Generado el {formatearFechaHora(avance.generadoEn)}</p>
      </div>

      <Tarjeta className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar nombre={avance.nombre} tamano="lg" tono="violeta" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-slate-900 leading-tight">{avance.nombre}</h2>
            <p className="text-sm font-semibold text-slate-500">
              @{avance.username}{avance.parentesco ? ` · Tu relación: ${etiquetaParentesco(avance.parentesco)}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
              {avance.niveles.map((n) => <Insignia key={n.codigo} tono={TONO_NIVEL[n.codigo] || 'gris'}>{n.nombre}</Insignia>)}
            </div>
            {estado.explicacion && <p className="mt-3 text-sm font-medium text-slate-600 max-w-xl">{estado.explicacion}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Anillo valor={avance.porcentaje} tono="indigo" etiqueta="Avance total" />
            <p className="text-xs font-bold text-slate-500">{avance.clasesVistas} de {avance.totalClases} clases</p>
          </div>
        </div>
      </Tarjeta>

      {avisos.length > 0 && (
        <div className="space-y-3">
          {avisos.map((a) => (
            <div key={a.id} role="status" className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${ESTILO_AVISO[a.tono] || ESTILO_AVISO.info}`}>
              <div className="flex-1">
                <p className="font-extrabold">{a.titulo}</p>
                <p className="text-sm font-medium opacity-90 mt-0.5">{a.texto}</p>
              </div>
              {enFamilia && a.accion && accionAviso(a.accion)}
            </div>
          ))}
        </div>
      )}

      <section aria-label="Indicadores" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icono={CheckCircle2} etiqueta="Clases vistas" valor={`${avance.clasesVistas}/${avance.totalClases}`} nota={`${avance.porcentaje}% del nivel`} tono="verde" />
        <StatCard icono={Clock} etiqueta="Tiempo estudiado" valor={avance.minutosVistos > 0 ? formatearDuracion(avance.minutosVistos) : '0 min'} nota="Suma de las clases vistas" tono="indigo" />
        <StatCard icono={TrendingUp} etiqueta="Última actividad" valor={textoActividad(avance.diasSinActividad)} nota={avance.ultimaActividad ? formatearFechaHora(avance.ultimaActividad) : 'Todavía sin actividad'} tono="azul" />
        <StatCard icono={CalendarClock} etiqueta="Vigencia" valor={textoVigencia(avance.diasParaVencer)} nota="De la matrícula que vence antes" tono={avance.diasParaVencer !== null && avance.diasParaVencer <= 7 ? 'ambar' : 'violeta'} />
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section aria-labelledby="titulo-semanas">
          <TituloSeccion id="titulo-semanas" icono={TrendingUp}>Actividad de las últimas semanas</TituloSeccion>
          <Tarjeta className="p-6">
            {totalSemanas(avance.semanas) === 0 ? (
              <p className="text-sm font-medium text-slate-500">Todavía no hay clases vistas en las últimas 6 semanas.</p>
            ) : (
              <BarrasVerticales series={[{ nombre: 'Clases vistas', tono: 'indigo' }]} datos={serieSemanal(avance.semanas)} />
            )}
            <p className="mt-4 text-xs font-semibold text-slate-400">Cada barra es una semana (la etiqueta es el lunes). Cuenta las clases vistas según la última vez que se abrieron.</p>
          </Tarjeta>
        </section>

        <section aria-labelledby="titulo-niveles">
          <TituloSeccion id="titulo-niveles" icono={GraduationCap}>Avance por nivel</TituloSeccion>
          <Tarjeta className="p-6 space-y-5">
            {avance.niveles.length === 0 && <p className="text-sm font-medium text-slate-500">No hay un nivel con matrícula vigente.</p>}
            {avance.niveles.map((n) => (
              <div key={n.codigo}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-sm font-bold text-slate-700">{n.nombre}</span>
                  <span className="text-sm font-black text-slate-900">{n.vistas}/{n.total} <span className="text-xs font-bold text-slate-400">· {n.porcentaje}%</span></span>
                </div>
                <BarraProgreso valor={n.vistas} max={n.total} tono={TONO_NIVEL[n.codigo] || 'indigo'} etiqueta={`Avance en ${n.nombre}`} />
              </div>
            ))}
          </Tarjeta>
        </section>
      </div>

      <section aria-labelledby="titulo-clases">
        <TituloSeccion id="titulo-clases" icono={CheckCircle2}>Clases del nivel</TituloSeccion>
        <div className="no-imprimir mb-4">
          <Chips etiqueta="Filtrar clases" valor={filtroClases} onCambiar={setFiltroClases} opciones={[
            { id: 'TODAS', texto: 'Todas', cuenta: clases.length },
            { id: 'VISTAS', texto: 'Vistas', cuenta: vistas },
            { id: 'PENDIENTES', texto: 'Pendientes', cuenta: clases.length - vistas },
          ]} />
        </div>
        {visibles.length === 0 ? (
          <EstadoVacio icono={CheckCircle2} titulo="No hay clases para mostrar" texto="Cuando la matrícula esté activa, aquí verás cada clase y si ya la vio." />
        ) : (
          <Tarjeta className="divide-y divide-slate-100">
            {visibles.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                {c.vista
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden="true" />
                  : <Circle className="w-5 h-5 text-slate-300 shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{c.titulo}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {c.nivel} · {formatearFecha(c.fechaClase)} · {formatearDuracion(c.duracionMinutos)}
                    {c.ultimaVez ? ` · Abierta ${formatearFechaHora(c.ultimaVez)}` : ''}
                  </p>
                </div>
                <Insignia tono={c.vista ? 'verde' : 'gris'}>{c.vista ? 'Vista' : 'Pendiente'}</Insignia>
              </div>
            ))}
          </Tarjeta>
        )}
      </section>

      <section aria-labelledby="titulo-matriculas">
        <TituloSeccion id="titulo-matriculas" icono={GraduationCap}>Matrículas</TituloSeccion>
        {avance.matriculas.length === 0 ? (
          <p className="text-sm font-medium text-slate-500">Todavía no hay matrículas registradas.</p>
        ) : (
          <Tarjeta className="divide-y divide-slate-100">
            {avance.matriculas.map((m) => {
              const est = estadoMatriculaEfectivo(m, hoy);
              return (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{m.nivel}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {m.horario} · {m.fechaInicio ? `${formatearFecha(m.fechaInicio)} – ${formatearFecha(m.fechaFin)}` : 'Sin fechas todavía'}
                    </p>
                  </div>
                  <Insignia tono={TONO_ESTADO_MATRICULA[est] || 'gris'}>{est}</Insignia>
                </div>
              );
            })}
          </Tarjeta>
        )}
      </section>

      <div className="no-imprimir flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={() => window.print()} className={BOTON_PRIMARIO}>
          <FileText className="w-4 h-4" aria-hidden="true" /> Imprimir o guardar en PDF
        </button>
        <button type="button" onClick={bajarCSV} disabled={clases.length === 0} className={BOTON_SECUNDARIO}>
          <Download className="w-4 h-4" aria-hidden="true" /> Descargar Excel (CSV)
        </button>
        {enFamilia && (
          <a href={enlaceWhatsAppTexto(mensajeWhatsApp('contacto', datosHijo))} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO}>
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> Hablar con la academia
          </a>
        )}
      </div>
    </div>
  );
}
