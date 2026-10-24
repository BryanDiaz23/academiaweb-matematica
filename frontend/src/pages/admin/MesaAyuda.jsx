import React, { useMemo, useState } from 'react';
import { AlarmClock, CheckCircle2, Download, Gauge, Inbox, Timer } from 'lucide-react';
import { api } from '../../api/client';
import { useDatos } from '../../hooks/useDatos';
import { descargarCSV } from '../../utils/descarga';
import { formatearFechaHora, hoyISO, normalizar, tiempoRelativo } from '../../utils/format';
import {
  ESTADOS_SOLICITUD, describirEstado, describirPrioridad, describirSla, esPendiente, exigeRespuesta,
  ordenarCola, siguientesEstados, textoSla, tiempoRestante,
} from '../../utils/mesaAyuda';
import Alerta from '../../components/Alerta';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CLASE_ETIQUETA, CLASE_INPUT, CampoBusqueda, Chips, Insignia, Selector, StatCard } from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { useAdmin } from './contexto';

/** 0.4 → "24 min"; 5.5 → "5.5 h" */
const textoHoras = (h) => (h < 1 ? `${Math.round(h * 60)} min` : `${h} h`);

const TEXTO_ACCION = { EN_PROCESO: 'Tomar / en proceso', RESUELTA: 'Resolver', RECHAZADA: 'Rechazar', CERRADA: 'Cerrar' };

function ModalAtencion({ solicitud, onCerrar, onGuardada }) {
  const toast = useToast();
  const opciones = siguientesEstados(solicitud.estado);
  const [estado, setEstado] = useState(opciones.includes('RESUELTA') ? 'RESUELTA' : opciones[0]);
  const [respuesta, setRespuesta] = useState(solicitud.respuesta || '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (exigeRespuesta(estado) && respuesta.trim().length < 5) {
      setError('Escribe la respuesta para el usuario (mínimo 5 caracteres).');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const r = await api(`/api/admin/mesa-ayuda/${solicitud.id}`, { method: 'PATCH', body: { estado, respuesta: respuesta.trim() || undefined } });
      toast.exito(`${r.codigo} pasó a ${describirEstado(r.estado).etiqueta.toLowerCase()}.`);
      onGuardada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`Atender ${solicitud.codigo}`} descripcion={`${solicitud.tipoNombre} · ${solicitud.solicitante} (@${solicitud.solicitanteUsername})`}
      pie={(
        <>
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cancelar</button>
          <button type="button" onClick={guardar} disabled={guardando} className={BOTON_PRIMARIO}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </>
      )}>
      <div className="space-y-4">
        <Alerta tipo="error">{error}</Alerta>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-black text-slate-900">{solicitud.asunto}</p>
          <p className="text-sm text-slate-600 font-medium mt-1 whitespace-pre-line">{solicitud.descripcion}</p>
          <p className="text-xs font-semibold text-slate-500 mt-2">Registrada {formatearFechaHora(solicitud.creadoEn)} · SLA {textoSla(solicitud.horasSla)} · {tiempoRestante(solicitud.venceEn)}</p>
        </div>
        <div>
          <span className={CLASE_ETIQUETA}>Nuevo estado</span>
          <Chips etiqueta="Nuevo estado" valor={estado} onCambiar={setEstado}
            opciones={opciones.map((o) => ({ id: o, texto: TEXTO_ACCION[o] || o }))} />
        </div>
        <div>
          <label htmlFor="respuesta-sol" className={CLASE_ETIQUETA}>Respuesta para el usuario {exigeRespuesta(estado) ? '(obligatoria)' : '(opcional)'}</label>
          <textarea id="respuesta-sol" rows={4} maxLength={1000} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} className={CLASE_INPUT}
            placeholder="Ej.: Ya activamos tu matrícula; vuelve a ingresar a tu aula." data-autofocus />
        </div>
      </div>
    </Modal>
  );
}

/** Panel de la mesa de ayuda: cola de solicitudes de servicio con su SLA e indicadores. */
export default function MesaAyuda({ filtroInicial }) {
  const { mesaAyuda } = useAdmin();
  const metricas = useDatos('/api/admin/mesa-ayuda/metricas');
  const toast = useToast();
  const [filtro, setFiltro] = useState(['PENDIENTES', 'TODAS', ...Object.keys(ESTADOS_SOLICITUD)].includes(filtroInicial) ? filtroInicial : 'PENDIENTES');
  const [buscar, setBuscar] = useState('');
  const [prioridad, setPrioridad] = useState('TODAS');
  const [atendiendo, setAtendiendo] = useState(null);

  const lista = useMemo(() => ordenarCola(Array.isArray(mesaAyuda.datos) ? mesaAyuda.datos : []), [mesaAyuda.datos]);
  const cuentas = useMemo(() => {
    const c = { PENDIENTES: lista.filter((s) => esPendiente(s.estado)).length, TODAS: lista.length };
    Object.keys(ESTADOS_SOLICITUD).forEach((e) => { c[e] = lista.filter((s) => s.estado === e).length; });
    return c;
  }, [lista]);

  const filtradas = useMemo(() => {
    const q = normalizar(buscar);
    return lista.filter((s) => {
      if (filtro === 'PENDIENTES' && !esPendiente(s.estado)) return false;
      if (!['PENDIENTES', 'TODAS'].includes(filtro) && s.estado !== filtro) return false;
      if (prioridad !== 'TODAS' && s.prioridad !== prioridad) return false;
      return !q || normalizar(`${s.codigo} ${s.asunto} ${s.descripcion} ${s.solicitante} ${s.solicitanteUsername} ${s.tipoNombre}`).includes(q);
    });
  }, [lista, filtro, buscar, prioridad]);

  const tabla = useTabla(filtradas, {
    clave: `${filtro}|${buscar}|${prioridad}`,
    accesores: { codigo: (s) => s.id, vence: (s) => s.venceEn, prioridad: (s) => describirPrioridad(s.prioridad).orden },
  });

  const recargar = async () => {
    setAtendiendo(null);
    await Promise.all([mesaAyuda.recargar(), metricas.recargar()]);
  };

  const exportar = () => {
    descargarCSV(`mesa-de-ayuda-${hoyISO()}`, [
      { titulo: 'Código', valor: (s) => s.codigo },
      { titulo: 'Tipo', valor: (s) => s.tipoNombre },
      { titulo: 'Prioridad', valor: (s) => s.prioridad },
      { titulo: 'Estado', valor: (s) => s.estado },
      { titulo: 'SLA', valor: (s) => s.estadoSla },
      { titulo: 'Solicitante', valor: (s) => s.solicitante },
      { titulo: 'Usuario', valor: (s) => s.solicitanteUsername },
      { titulo: 'Asunto', valor: (s) => s.asunto },
      { titulo: 'Registrada', valor: (s) => s.creadoEn || '' },
      { titulo: 'Vence', valor: (s) => s.venceEn || '' },
      { titulo: 'Resuelta', valor: (s) => s.resueltoEn || '' },
      { titulo: 'Respuesta', valor: (s) => s.respuesta || '' },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} solicitud(es).`);
  };

  const m = metricas.datos && !Array.isArray(metricas.datos) ? metricas.datos : null;

  const columnas = [
    {
      id: 'codigo', titulo: 'Solicitud', ordenable: true,
      render: (s) => (
        <>
          <p className="text-xs font-extrabold text-slate-400 whitespace-nowrap">{s.codigo}</p>
          <p className="font-bold text-slate-900">{s.asunto}</p>
          <p className="text-xs text-slate-500">{s.tipoNombre}</p>
        </>
      ),
    },
    {
      id: 'solicitante', titulo: 'Solicitante',
      render: (s) => (<><p className="font-semibold text-slate-800">{s.solicitante}</p><p className="text-xs text-slate-500">@{s.solicitanteUsername} · {s.solicitanteRol === 'APODERADO' ? 'Apoderado' : 'Alumno'}</p></>),
    },
    { id: 'prioridad', titulo: 'Prioridad', ordenable: true, render: (s) => { const p = describirPrioridad(s.prioridad); return <Insignia tono={p.tono}>{p.etiqueta}</Insignia>; } },
    { id: 'estado', titulo: 'Estado', render: (s) => { const e = describirEstado(s.estado); return <Insignia tono={e.tono}>{e.etiqueta}</Insignia>; } },
    {
      id: 'vence', titulo: 'SLA', ordenable: true,
      render: (s) => {
        const sla = describirSla(s.estadoSla);
        return (
          <>
            <Insignia tono={sla.tono}>{sla.etiqueta}</Insignia>
            <p className="text-xs text-slate-500 mt-1 whitespace-nowrap">{esPendiente(s.estado) ? tiempoRestante(s.venceEn) : `atendida ${tiempoRelativo(s.resueltoEn)}`}</p>
          </>
        );
      },
    },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (s) => (siguientesEstados(s.estado).length > 0
        ? <BotonFila tono="indigo" icono={CheckCircle2} onClick={() => setAtendiendo(s)}>Atender</BotonFila>
        : <span className="text-xs font-semibold text-slate-400">Finalizada</span>),
    },
  ];

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{mesaAyuda.error || metricas.error}</Alerta>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icono={Inbox} etiqueta="Pendientes" valor={m ? m.pendientes : '—'} nota={m ? `${m.total} solicitudes en total` : ''} tono="azul" onClick={() => setFiltro('PENDIENTES')} />
        <StatCard icono={AlarmClock} etiqueta="Por vencer o vencidas" valor={m ? m.porVencer + m.vencidas : '—'} nota={m ? `${m.vencidas} con el SLA ya vencido` : ''} tono={m && m.vencidas > 0 ? 'rojo' : 'ambar'} />
        <StatCard icono={Gauge} etiqueta="Cumplimiento del SLA" valor={m ? `${m.cumplimientoSla} %` : '—'} nota={m ? `${m.atendidas} atendida(s) · meta ≥ 90 %` : ''} tono={m && m.cumplimientoSla < 90 ? 'rojo' : 'verde'} />
        <StatCard icono={Timer} etiqueta="Tiempo medio de resolución" valor={m ? textoHoras(m.horasPromedioResolucion) : '—'} nota="Desde el registro hasta la respuesta" tono="violeta" />
      </div>
      <Chips etiqueta="Filtrar por estado" valor={filtro} onCambiar={setFiltro} opciones={[
        { id: 'PENDIENTES', texto: 'Pendientes', cuenta: cuentas.PENDIENTES },
        ...Object.entries(ESTADOS_SOLICITUD).map(([id, e]) => ({ id, texto: e.etiqueta, cuenta: cuentas[id] })),
        { id: 'TODAS', texto: 'Todas', cuenta: cuentas.TODAS },
      ]} />
      <div className="flex flex-col sm:flex-row gap-3">
        <CampoBusqueda id="buscar-mesa" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por código, asunto o solicitante…" className="flex-1 max-w-xl" />
        <Selector id="filtro-prioridad" etiqueta="Filtrar por prioridad" valor={prioridad} onCambiar={setPrioridad} className="sm:w-52">
          <option value="TODAS">Todas las prioridades</option>
          <option value="ALTA">Prioridad alta</option>
          <option value="MEDIA">Prioridad media</option>
          <option value="BAJA">Prioridad baja</option>
        </Selector>
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} sm:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>
      {mesaAyuda.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Solicitudes de servicio"
          vacio={filtro === 'PENDIENTES' && lista.length > 0 ? '¡Cola al día! No hay solicitudes pendientes.' : 'No hay solicitudes que coincidan con los filtros.'} />
      )}
      {atendiendo && <ModalAtencion solicitud={atendiendo} onCerrar={() => setAtendiendo(null)} onGuardada={recargar} />}
    </div>
  );
}
