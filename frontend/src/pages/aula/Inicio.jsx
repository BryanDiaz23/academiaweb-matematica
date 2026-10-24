import React, { useMemo } from 'react';
import {
  AlertTriangle, ArrowRight, BookOpenCheck, CalendarClock, CalendarPlus, Clock, Flame, GraduationCap, Heart, MessageCircle,
  PlayCircle, Sparkles, Star, Timer, Trophy,
} from 'lucide-react';
import { enlaceWhatsAppTexto } from '../../config';
import { diasHasta, formatearDuracion, formatearFecha, textoDias, urlSegura } from '../../utils/format';
import { crearICS, describirProxima, proximaClase } from '../../utils/horarios';
import { descargarArchivo } from '../../utils/descarga';
import { Anillo, BarraProgreso, BOTON_PRIMARIO, BOTON_SECUNDARIO, EstadoVacio, Esqueleto, Insignia, StatCard, Tarjeta, TituloSeccion, TONO_NIVEL } from '../../components/ui/ui';
import { esNueva, useAula } from './contexto';

function AvisoMatricula({ tono, icono: Icono, titulo, texto, accion }) {
  const estilos = {
    ambar: 'border-amber-200 bg-amber-50 text-amber-900',
    rojo: 'border-red-200 bg-red-50 text-red-800',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  };
  return (
    <div role="status" className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${estilos[tono]}`}>
      <Icono className="w-6 h-6 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-extrabold">{titulo}</p>
        <p className="text-sm font-medium opacity-90 mt-0.5">{texto}</p>
      </div>
      {accion}
    </div>
  );
}

export default function Inicio() {
  const { matriculas, clases, horarios, derivados, irA, registrarApertura } = useAula();

  const cargando = matriculas === null || clases === null;

  const { continuar, siguiente, novedades, favoritas, porNivel } = useMemo(() => {
    const todas = clases || [];
    const conAcceso = todas.filter((c) => c.ultimaVez).sort((a, b) => b.ultimaVez.localeCompare(a.ultimaVez));
    const sinVer = todas.filter((c) => !c.vista).sort((a, b) => a.fechaClase.localeCompare(b.fechaClase));
    const grupos = new Map();
    todas.forEach((c) => {
      const g = grupos.get(c.nivelCodigo) || { codigo: c.nivelCodigo, nivel: c.nivel, total: 0, vistas: 0 };
      g.total += 1;
      if (c.vista) g.vistas += 1;
      grupos.set(c.nivelCodigo, g);
    });
    const recientes = [...todas].sort((a, b) => b.fechaClase.localeCompare(a.fechaClase));
    const nuevas = recientes.filter(esNueva).slice(0, 3);
    return {
      continuar: conAcceso.find((c) => !c.vista) || null,
      siguiente: sinVer[0] || null,
      novedades: nuevas.length > 0 ? nuevas : recientes.slice(0, 3),
      favoritas: todas.filter((c) => c.favorita).slice(0, 4),
      porNivel: [...grupos.values()],
    };
  }, [clases]);

  // Próxima clase en vivo entre las matrículas vigentes
  const proxima = useMemo(() => {
    const candidatas = derivados.activas
      .map((m) => {
        const h = horarios.find((x) => x.id === m.horarioId);
        const prox = h ? proximaClase(h) : null;
        return prox ? { matricula: m, horario: h, prox } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.prox.inicio - b.prox.inicio);
    return candidatas[0] || null;
  }, [derivados.activas, horarios]);

  const bajarICS = (horario, nivel) => {
    const ics = crearICS(horario, nivel);
    if (ics) descargarArchivo(`clase-en-vivo-${horario.turno.toLowerCase()}.ics`, ics, 'text/calendar;charset=utf-8');
  };

  if (cargando) {
    return (
      <div className="space-y-6">
        <Esqueleto className="h-44" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-28" />)}</div>
        <Esqueleto className="h-48" />
      </div>
    );
  }

  const { activas, pendientes, vencidas, porVencer, diasRestantes, tieneActiva } = derivados;
  const sinMatriculas = matriculas.length === 0;
  const masUrgente = porVencer[0];
  const ultimaVencida = vencidas[0];

  /** Abre el video en una pestaña nueva y registra la apertura para "Continuar viendo". */
  const abrirVideo = (c) => {
    const url = urlSegura(c.urlVideo);
    if (!url) {
      irA('clases');
      return;
    }
    registrarApertura(c);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      {/* Avisos de vigencia */}
      <div className="space-y-3">
        {sinMatriculas && (
          <AvisoMatricula tono="indigo" icono={Sparkles} titulo="¡Empieza hoy mismo!"
            texto="Aún no tienes matrículas. Elige tu nivel y turno y la academia activará tu acceso cuando confirme el pago."
            accion={<button type="button" onClick={() => irA('matriculas')} className={BOTON_PRIMARIO}>Solicitar matrícula <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>} />
        )}
        {!tieneActiva && pendientes.length > 0 && (
          <AvisoMatricula tono="ambar" icono={Timer} titulo="Tu matrícula está en revisión"
            texto="Cuando la academia valide tu pago se activará y verás aquí tus clases grabadas."
            accion={<a href={enlaceWhatsAppTexto('¡Hola! Quiero confirmar el pago de mi matrícula en Matemática Sin Estrés.')} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO}><MessageCircle className="w-4 h-4" aria-hidden="true" /> Confirmar pago</a>} />
        )}
        {masUrgente && (
          <AvisoMatricula tono="ambar" icono={AlertTriangle} titulo={`Tu matrícula de ${masUrgente.nivel} ${textoDias(diasHasta(masUrgente.fechaFin))}`}
            texto={`Vigente hasta el ${formatearFecha(masUrgente.fechaFin)}. Renueva a tiempo para no perder el acceso a tus clases grabadas.`}
            accion={<a href={enlaceWhatsAppTexto(`¡Hola! Quiero renovar mi matrícula de ${masUrgente.nivel} en Matemática Sin Estrés.`)} target="_blank" rel="noopener noreferrer" className={BOTON_PRIMARIO}><MessageCircle className="w-4 h-4" aria-hidden="true" /> Renovar por WhatsApp</a>} />
        )}
        {!tieneActiva && pendientes.length === 0 && ultimaVencida && (
          <AvisoMatricula tono="rojo" icono={AlertTriangle} titulo={`Tu matrícula de ${ultimaVencida.nivel} venció`}
            texto={`Venció el ${formatearFecha(ultimaVencida.fechaFin)}. Escríbenos para renovarla y recuperar el acceso a tus clases grabadas.`}
            accion={<a href={enlaceWhatsAppTexto(`¡Hola! Quiero renovar mi matrícula de ${ultimaVencida.nivel} en Matemática Sin Estrés.`)} target="_blank" rel="noopener noreferrer" className={BOTON_PRIMARIO}><MessageCircle className="w-4 h-4" aria-hidden="true" /> Renovar por WhatsApp</a>} />
        )}
      </div>

      {/* Portada con progreso */}
      <section aria-label="Resumen de tu avance" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-lg shadow-indigo-600/20">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-emerald-300/20" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-wide">Tu avance</p>
            <h2 className="text-2xl sm:text-3xl font-black mt-1 leading-tight">
              {derivados.totalClases === 0
                ? 'Tus clases aparecerán aquí'
                : derivados.progreso === 100
                  ? '¡Completaste todas las clases disponibles!'
                  : `Llevas ${derivados.clasesVistas} de ${derivados.totalClases} clases vistas`}
            </h2>
            <p className="text-indigo-100 font-medium mt-2 text-sm sm:text-base">
              {derivados.totalClases === 0
                ? 'Cuando tu matrícula esté activa podrás repasar cada sesión grabada cuando quieras.'
                : derivados.nuevas > 0
                  ? `Tienes ${derivados.nuevas} clase${derivados.nuevas === 1 ? '' : 's'} nueva${derivados.nuevas === 1 ? '' : 's'} esperándote. Cada repaso cuenta: ¡sin estrés!`
                  : 'Cada repaso cuenta. Avanza a tu ritmo y marca lo que ya dominas.'}
            </p>
            {derivados.totalClases > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => irA('clases')} className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-sm px-5 py-2.5 rounded-xl">
                  <PlayCircle className="w-4 h-4" aria-hidden="true" /> Ir a mis clases
                </button>
                <span className="inline-flex items-center gap-2 bg-white/15 text-white font-bold text-sm px-4 py-2.5 rounded-xl">
                  <Clock className="w-4 h-4" aria-hidden="true" /> {formatearDuracion(derivados.minutosVistos) || '0 min'} de estudio
                </span>
              </div>
            )}
          </div>
          {derivados.totalClases > 0 && (
            <div className="flex items-center gap-4 self-start sm:self-center bg-white rounded-3xl p-4 text-slate-900">
              <Anillo valor={derivados.progreso} tono={derivados.progreso === 100 ? 'verde' : 'indigo'} etiqueta="Progreso total" />
              <div className="pr-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tu progreso</p>
                <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-1">
                  {derivados.progreso === 100 ? <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" /> : <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />}
                  {derivados.progreso === 100 ? '¡Excelente!' : '¡Sigue así!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icono={BookOpenCheck} etiqueta="Clases disponibles" valor={derivados.totalClases} tono="indigo" nota={derivados.nuevas > 0 ? `${derivados.nuevas} nueva(s) esta semana` : 'Todas al día'} onClick={() => irA('clases')} />
        <StatCard icono={Trophy} etiqueta="Clases vistas" valor={`${derivados.clasesVistas}/${derivados.totalClases}`} tono="verde" nota={`${derivados.progreso}% completado`} />
        <StatCard icono={Heart} etiqueta="Favoritas" valor={derivados.favoritas} tono="rosa" nota="Tus clases guardadas" />
        <StatCard icono={CalendarClock} etiqueta="Vigencia" valor={diasRestantes === null ? (tieneActiva ? 'Sin límite' : '—') : diasRestantes === 0 ? 'Hoy' : `${diasRestantes} d`}
          tono={diasRestantes !== null && diasRestantes <= 7 ? 'ambar' : 'azul'}
          nota={tieneActiva ? `${activas.length} matrícula(s) activa(s)` : 'Sin matrícula activa'} onClick={() => irA('matriculas')} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continuar viendo */}
        <section aria-labelledby="titulo-continuar" className="lg:col-span-2">
          <TituloSeccion id="titulo-continuar" icono={PlayCircle}>{continuar ? 'Continuar viendo' : 'Tu siguiente clase'}</TituloSeccion>
          {continuar || siguiente ? (
            (() => {
              const c = continuar || siguiente;
              return (
                <Tarjeta className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-full sm:w-44 h-28 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <PlayCircle className="w-12 h-12 text-white/90" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Insignia tono={TONO_NIVEL[c.nivelCodigo] || 'gris'}>{c.nivel}</Insignia>
                      {esNueva(c) && <Insignia tono="verde"><Sparkles className="w-3 h-3" aria-hidden="true" /> NUEVA</Insignia>}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-snug">{c.titulo}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Clase del {formatearFecha(c.fechaClase)} · {formatearDuracion(c.duracionMinutos)}
                    </p>
                  </div>
                  <button type="button" onClick={() => abrirVideo(c)} className={`${BOTON_PRIMARIO} shrink-0`}>
                    {continuar ? 'Retomar' : 'Empezar'} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </Tarjeta>
              );
            })()
          ) : (
            <EstadoVacio icono={PlayCircle} titulo={tieneActiva ? '¡Estás al día!' : 'Aún no hay clases para ti'}
              texto={tieneActiva ? 'Vistas todas las clases disponibles. Pronto subiremos más.' : 'Las clases grabadas se desbloquean con una matrícula activa.'} />
          )}
        </section>

        {/* Próxima clase en vivo */}
        <section aria-labelledby="titulo-vivo">
          <TituloSeccion id="titulo-vivo" icono={CalendarClock}>Próxima clase en vivo</TituloSeccion>
          {proxima ? (
            <Tarjeta className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{proxima.matricula.nivel} · Turno {proxima.horario.turno}</p>
                <p className={`text-xl font-black mt-1 ${proxima.prox.enCurso ? 'text-emerald-600' : 'text-slate-900'}`}>{describirProxima(proxima.prox)}</p>
                <p className="text-sm font-medium text-slate-500 mt-0.5">{proxima.horario.dias} · {proxima.horario.horaInicio} – {proxima.horario.horaFin}</p>
              </div>
              <button type="button" onClick={() => bajarICS(proxima.horario, proxima.matricula.nivel)} className={`${BOTON_SECUNDARIO} w-full`}>
                <CalendarPlus className="w-4 h-4" aria-hidden="true" /> Agregar a mi calendario
              </button>
            </Tarjeta>
          ) : (
            <EstadoVacio icono={CalendarClock} titulo="Sin clases en vivo" texto="Cuando tengas una matrícula activa verás aquí tu próxima sesión." />
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avance por nivel */}
        <section aria-labelledby="titulo-avance">
          <TituloSeccion id="titulo-avance" icono={GraduationCap}>Avance por nivel</TituloSeccion>
          {porNivel.length > 0 ? (
            <Tarjeta className="p-5 space-y-5">
              {porNivel.map((g) => (
                <div key={g.codigo}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-800">{g.nivel}</span>
                    <span className="text-xs font-extrabold text-slate-500">{g.vistas}/{g.total} clases</span>
                  </div>
                  <BarraProgreso valor={g.vistas} max={g.total} tono={TONO_NIVEL[g.codigo] || 'indigo'} etiqueta={`Avance en ${g.nivel}`} />
                </div>
              ))}
            </Tarjeta>
          ) : (
            <EstadoVacio icono={GraduationCap} titulo="Sin avance todavía" texto="Marca tus clases como vistas para seguir tu progreso por nivel." />
          )}
        </section>

        {/* Novedades */}
        <section aria-labelledby="titulo-novedades">
          <TituloSeccion id="titulo-novedades" icono={Sparkles} accion={novedades.length > 0 && <button type="button" onClick={() => irA('clases')} className="text-sm font-bold text-indigo-600 hover:underline">Ver todas</button>}>
            Últimas clases
          </TituloSeccion>
          {novedades.length > 0 ? (
            <Tarjeta className="divide-y divide-slate-100">
              {novedades.map((c) => (
                <button key={c.id} type="button" onClick={() => abrirVideo(c)} className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 first:rounded-t-2xl last:rounded-b-2xl">
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><PlayCircle className="w-5 h-5" aria-hidden="true" /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-slate-900 truncate">{c.titulo}</span>
                    <span className="block text-xs font-semibold text-slate-500">{formatearFecha(c.fechaClase)} · {formatearDuracion(c.duracionMinutos)}</span>
                  </span>
                  {esNueva(c) && <Insignia tono="verde">NUEVA</Insignia>}
                  {c.vista && <Insignia tono="gris">Vista</Insignia>}
                </button>
              ))}
            </Tarjeta>
          ) : (
            <EstadoVacio icono={Sparkles} titulo="Todavía no hay clases" texto="Aquí aparecerán las clases más recientes de tu nivel." />
          )}
        </section>
      </div>

      {/* Favoritas */}
      {favoritas.length > 0 && (
        <section aria-labelledby="titulo-favoritas">
          <TituloSeccion id="titulo-favoritas" icono={Star}>Tus favoritas</TituloSeccion>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoritas.map((c) => (
              <button key={c.id} type="button" onClick={() => abrirVideo(c)} className="text-left bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:border-pink-300 hover:shadow-sm transition-all">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500 shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-slate-900 truncate">{c.titulo}</span>
                  <span className="block text-xs font-semibold text-slate-500">{c.nivel}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
