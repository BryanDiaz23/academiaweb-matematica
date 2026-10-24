import React, { useMemo } from 'react';
import {
  Activity, AlertTriangle, Banknote, BookOpen, CheckCircle2, ClipboardList, Eye, GraduationCap, KeyRound, LifeBuoy, Lock, ShieldAlert, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import { aISO, diasHasta, formatearSoles, hoyISO, textoDias, tiempoRelativo } from '../../utils/format';
import { Avatar, EstadoVacio, Esqueleto, Insignia, StatCard, Tarjeta, TituloSeccion, TONO_ESTADO_MATRICULA } from '../../components/ui/ui';
import { BarrasHorizontales, BarrasVerticales, GraficoDonut } from '../../components/ui/Graficos';
import { estadoEfectivo, useAdmin } from './contexto';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const TONO_EVENTO = {
  LOGIN_EXITOSO: 'verde', REGISTRO: 'indigo', CAMBIO_PASSWORD: 'azul', LOGIN_FALLIDO: 'rojo', CUENTA_BLOQUEADA: 'rojo',
  LOGIN_CUENTA_BLOQUEADA: 'naranja', LOGIN_CUENTA_INACTIVA: 'naranja', PASSWORD_RESTABLECIDA: 'ambar',
  VINCULO_CREADO: 'violeta', VINCULO_ELIMINADO: 'gris', SOLICITUD_CREADA: 'azul', SOLICITUD_ACTUALIZADA: 'indigo',
};

function etiquetaEvento(e) {
  return e.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function Dashboard() {
  const { resumen, matriculas, usuarios, clases, solicitudes, auditoria, mesaAyuda, niveles, irA } = useAdmin();

  const cargando = [resumen, matriculas, usuarios, clases, solicitudes, auditoria, niveles].some((r) => r.datos === null);

  const m = useMemo(() => {
    const hoy = hoyISO();
    const lm = matriculas.datos || [];
    const lu = usuarios.datos || [];
    const ln = niveles.datos || [];
    const precio = new Map(ln.map((n) => [n.id, Number(n.precioMensual)]));

    const conEstado = lm.map((x) => ({ ...x, efectivo: estadoEfectivo(x, hoy) }));
    const vigentes = conEstado.filter((x) => x.efectivo === 'ACTIVA');
    const ingresoMensual = vigentes.reduce((s, x) => s + (precio.get(x.nivelId) || 0), 0);
    const porVencer = vigentes.filter((x) => x.fechaFin && diasHasta(x.fechaFin) <= 7).sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));
    const conteo = (est) => conEstado.filter((x) => x.efectivo === est).length;

    const porNivel = ln.map((n) => {
      const activas = vigentes.filter((x) => x.nivelId === n.id).length;
      return { etiqueta: n.nombre, valor: activas, nota: formatearSoles(activas * Number(n.precioMensual)), tono: { PRIMARIA: 'verde', SECUNDARIA: 'indigo', PRE: 'violeta' }[n.codigo] || 'indigo' };
    });

    // Últimos 6 meses: alumnos nuevos y matrículas solicitadas
    const ahora = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const f = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
      return { clave: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`, etiqueta: MESES[f.getMonth()] };
    });
    const altas = meses.map((mes) => ({
      etiqueta: mes.etiqueta,
      valores: [
        lu.filter((u) => u.rol === 'ALUMNO' && (u.creadoEn || '').startsWith(mes.clave)).length,
        lm.filter((x) => (x.creadoEn || '').startsWith(mes.clave)).length,
      ],
    }));

    // Inicios de sesión de los últimos 7 días (sobre los últimos 100 eventos registrados)
    const la = auditoria.datos || [];
    const dias = Array.from({ length: 7 }, (_, i) => {
      const f = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - (6 - i));
      return { clave: aISO(f), etiqueta: DIAS_SEMANA[f.getDay()] };
    });
    const actividad = dias.map((d) => ({
      etiqueta: d.etiqueta,
      valores: [
        la.filter((e) => e.evento === 'LOGIN_EXITOSO' && (e.creadoEn || '').startsWith(d.clave)).length,
        la.filter((e) => e.evento === 'LOGIN_FALLIDO' && (e.creadoEn || '').startsWith(d.clave)).length,
      ],
    }));

    const topClases = [...(clases.datos || [])].filter((c) => (c.vistas || 0) > 0).sort((a, b) => b.vistas - a.vistas).slice(0, 5);
    const totalVistas = (clases.datos || []).reduce((s, c) => s + (c.vistas || 0), 0);

    return {
      conEstado, vigentes, ingresoMensual, porVencer, porNivel, altas, actividad, topClases, totalVistas,
      pendientes: conteo('PENDIENTE'), vencidas: conteo('VENCIDA'), anuladas: conteo('ANULADA'),
      bloqueados: (usuarios.datos || []).filter((u) => u.bloqueado).length,
      temporales: (usuarios.datos || []).filter((u) => u.debeCambiarPassword).length,
      sinAtender: (solicitudes.datos || []).filter((s) => !s.atendida).length,
      alumnos: lu.filter((u) => u.rol === 'ALUMNO').length,
      recientes: la.slice(0, 8),
    };
  }, [matriculas.datos, usuarios.datos, niveles.datos, clases.datos, solicitudes.datos, auditoria.datos]);

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-32" />)}</div>
        <div className="grid lg:grid-cols-2 gap-6"><Esqueleto className="h-64" /><Esqueleto className="h-64" /></div>
      </div>
    );
  }

  const r = resumen.datos && !Array.isArray(resumen.datos) ? resumen.datos : {};
  const fallidos24 = r.loginsFallidos24h || 0;
  const errores = [resumen, matriculas, usuarios, clases, solicitudes, auditoria].map((x) => x.error).filter(Boolean);

  const tickets = Array.isArray(mesaAyuda?.datos) ? mesaAyuda.datos : [];
  const ticketsEnRiesgo = tickets.filter((t) => (t.estado === 'ABIERTA' || t.estado === 'EN_PROCESO') && (t.estadoSla === 'POR_VENCER' || t.estadoSla === 'VENCIDA')).length;
  const atencion = [
    { clave: 'sla', cuenta: ticketsEnRiesgo, icono: LifeBuoy, tono: 'rojo', texto: 'solicitud(es) de servicio por vencer su SLA', detalle: 'Atiéndelas en la mesa de ayuda.', ir: () => irA('mesa', 'PENDIENTES') },
    { clave: 'pend', cuenta: m.pendientes, icono: GraduationCap, tono: 'ambar', texto: 'matrícula(s) por validar', detalle: 'Confirma el pago y actívalas.', ir: () => irA('matriculas', 'PENDIENTE') },
    { clave: 'venc', cuenta: m.porVencer.length, icono: AlertTriangle, tono: 'naranja', texto: 'matrícula(s) vencen en 7 días', detalle: 'Avísales para renovar a tiempo.', ir: () => irA('matriculas', 'POR_VENCER') },
    { clave: 'sol', cuenta: m.sinAtender, icono: ClipboardList, tono: 'rosa', texto: 'solicitud(es) sin atender', detalle: 'Interesados esperando su clase de diagnóstico.', ir: () => irA('solicitudes', 'PENDIENTES') },
    { clave: 'blo', cuenta: m.bloqueados, icono: Lock, tono: 'rojo', texto: 'cuenta(s) bloqueada(s)', detalle: 'Por intentos fallidos de ingreso.', ir: () => irA('usuarios', 'BLOQUEADOS') },
    { clave: 'tmp', cuenta: m.temporales, icono: KeyRound, tono: 'azul', texto: 'contraseña(s) temporal(es) sin cambiar', detalle: 'El usuario aún no ingresó con la nueva clave.', ir: () => irA('usuarios', 'TEMPORAL') },
    { clave: 'fall', cuenta: fallidos24 >= 5 ? fallidos24 : 0, icono: ShieldAlert, tono: 'rojo', texto: 'intentos de login fallidos en 24 h', detalle: 'Revisa si hay un ataque de fuerza bruta.', ir: () => irA('auditoria', 'FALLIDOS') },
  ].filter((x) => x.cuenta > 0);

  return (
    <div className="space-y-8">
      {errores.length > 0 && (
        <div role="alert" className="p-4 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-800">
          Algunos datos no se pudieron cargar: {errores[0]}
        </div>
      )}

      {/* Indicadores */}
      <section aria-label="Indicadores principales" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icono={Banknote} etiqueta="Ingreso mensual est." valor={formatearSoles(m.ingresoMensual)} tono="verde" nota={`${m.vigentes.length} matrícula(s) vigente(s)`} onClick={() => irA('matriculas', 'ACTIVA')} />
        <StatCard icono={Users} etiqueta="Alumnos" valor={m.alumnos} tono="violeta" nota={`${r.usuarios ?? (usuarios.datos || []).length} usuarios en total`} onClick={() => irA('usuarios', 'ALUMNOS')} />
        <StatCard icono={GraduationCap} etiqueta="Por validar" valor={m.pendientes} tono="ambar" nota={m.pendientes ? 'Requieren tu acción' : 'Todo al día'} onClick={() => irA('matriculas', 'PENDIENTE')} />
        <StatCard icono={BookOpen} etiqueta="Clases publicadas" valor={r.clasesPublicadas ?? (clases.datos || []).filter((c) => c.publicada).length} tono="azul" nota={`${m.totalVistas} visualización(es) de alumnos`} onClick={() => irA('clases')} />
      </section>

      {/* Atención */}
      <section aria-labelledby="titulo-atencion">
        <TituloSeccion id="titulo-atencion" icono={AlertTriangle}>Requiere tu atención</TituloSeccion>
        {atencion.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
            <p className="font-bold">Todo en orden: no hay pendientes ni alertas de seguridad.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {atencion.map((a) => (
              <button key={a.clave} type="button" onClick={a.ir}
                className="text-left bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition-all">
                <Insignia tono={a.tono} className="!rounded-xl !px-2.5 !py-2 !text-base"><a.icono className="w-4 h-4" aria-hidden="true" /> {a.cuenta}</Insignia>
                <span>
                  <span className="block text-sm font-extrabold text-slate-900">{a.texto}</span>
                  <span className="block text-xs font-medium text-slate-500 mt-0.5">{a.detalle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="titulo-estados">
          <TituloSeccion id="titulo-estados" icono={GraduationCap}>Matrículas por estado</TituloSeccion>
          <Tarjeta className="p-6">
            {m.conEstado.length === 0 ? (
              <EstadoVacio icono={GraduationCap} titulo="Sin matrículas todavía" texto="Cuando los alumnos soliciten matrícula verás aquí su estado." />
            ) : (
              <GraficoDonut titulo="matrículas" datos={[
                { etiqueta: 'Activas', valor: m.vigentes.length, tono: TONO_ESTADO_MATRICULA.ACTIVA },
                { etiqueta: 'Pendientes', valor: m.pendientes, tono: TONO_ESTADO_MATRICULA.PENDIENTE },
                { etiqueta: 'Vencidas', valor: m.vencidas, tono: TONO_ESTADO_MATRICULA.VENCIDA },
                { etiqueta: 'Anuladas', valor: m.anuladas, tono: TONO_ESTADO_MATRICULA.ANULADA },
              ]} />
            )}
          </Tarjeta>
        </section>

        <section aria-labelledby="titulo-niveles">
          <TituloSeccion id="titulo-niveles" icono={TrendingUp}>Alumnos activos e ingreso por nivel</TituloSeccion>
          <Tarjeta className="p-6">
            {m.porNivel.length === 0 ? <Esqueleto className="h-32" /> : <BarrasHorizontales datos={m.porNivel} formato={(v) => `${v} alumno${v === 1 ? '' : 's'}`} />}
            <p className="text-xs font-semibold text-slate-400 mt-4">Ingreso estimado = matrículas vigentes × precio mensual del nivel.</p>
          </Tarjeta>
        </section>

        <section aria-labelledby="titulo-altas">
          <TituloSeccion id="titulo-altas" icono={UserPlus}>Crecimiento (6 meses)</TituloSeccion>
          <Tarjeta className="p-6">
            <BarrasVerticales series={[{ nombre: 'Alumnos nuevos', tono: 'violeta' }, { nombre: 'Matrículas solicitadas', tono: 'verde' }]} datos={m.altas} />
          </Tarjeta>
        </section>

        <section aria-labelledby="titulo-logins">
          <TituloSeccion id="titulo-logins" icono={ShieldAlert}>Accesos de los últimos 7 días</TituloSeccion>
          <Tarjeta className="p-6">
            <BarrasVerticales series={[{ nombre: 'Exitosos', tono: 'indigo' }, { nombre: 'Fallidos', tono: 'rojo' }]} datos={m.actividad} />
            <p className="text-xs font-semibold text-slate-400 mt-4">Calculado con los últimos 100 eventos de la bitácora.</p>
          </Tarjeta>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clases más vistas */}
        <section aria-labelledby="titulo-top">
          <TituloSeccion id="titulo-top" icono={Eye}>Clases más vistas</TituloSeccion>
          {m.topClases.length === 0 ? (
            <EstadoVacio icono={Eye} titulo="Aún no hay visualizaciones" texto="Cuando los alumnos marquen clases como vistas, las más populares aparecerán aquí." />
          ) : (
            <Tarjeta className="p-6">
              <BarrasHorizontales datos={m.topClases.map((c) => ({ etiqueta: c.titulo, valor: c.vistas, nota: c.nivel, tono: 'azul' }))} formato={(v) => `${v} vista${v === 1 ? '' : 's'}`} />
            </Tarjeta>
          )}
        </section>

        {/* Por vencer + actividad */}
        <section aria-labelledby="titulo-vencen">
          <TituloSeccion id="titulo-vencen" icono={AlertTriangle} accion={m.porVencer.length > 0 && <button type="button" onClick={() => irA('matriculas', 'POR_VENCER')} className="text-sm font-bold text-indigo-600 hover:underline">Ver todas</button>}>
            Próximas a vencer
          </TituloSeccion>
          {m.porVencer.length === 0 ? (
            <EstadoVacio icono={CheckCircle2} titulo="Nada por vencer esta semana" texto="Las matrículas que venzan en los próximos 7 días aparecerán aquí." />
          ) : (
            <Tarjeta className="divide-y divide-slate-100">
              {m.porVencer.slice(0, 5).map((x) => (
                <div key={x.id} className="px-5 py-3.5 flex items-center gap-3">
                  <Avatar nombre={x.alumno} tamano="sm" tono="ambar" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{x.alumno}</p>
                    <p className="text-xs font-semibold text-slate-500 truncate">{x.nivel}</p>
                  </div>
                  <Insignia tono={diasHasta(x.fechaFin) <= 2 ? 'rojo' : 'ambar'}>{textoDias(diasHasta(x.fechaFin))}</Insignia>
                </div>
              ))}
            </Tarjeta>
          )}
        </section>
      </div>

      {/* Actividad reciente */}
      <section aria-labelledby="titulo-reciente">
        <TituloSeccion id="titulo-reciente" icono={Activity} accion={<button type="button" onClick={() => irA('auditoria')} className="text-sm font-bold text-indigo-600 hover:underline">Abrir auditoría</button>}>
          Actividad reciente
        </TituloSeccion>
        {m.recientes.length === 0 ? (
          <EstadoVacio titulo="Sin eventos registrados" />
        ) : (
          <Tarjeta className="divide-y divide-slate-100">
            {m.recientes.map((e) => (
              <div key={e.id} className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Insignia tono={TONO_EVENTO[e.evento] || 'gris'}>{etiquetaEvento(e.evento)}</Insignia>
                <span className="text-sm font-bold text-slate-800">{e.usuario ? `@${e.usuario}` : e.identificador || '—'}</span>
                <span className="text-xs font-semibold text-slate-400 sm:ml-auto">{tiempoRelativo(e.creadoEn)}</span>
              </div>
            ))}
          </Tarjeta>
        )}
      </section>
    </div>
  );
}
