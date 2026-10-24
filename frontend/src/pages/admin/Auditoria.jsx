import React, { useMemo, useState } from 'react';
import { Download, Info } from 'lucide-react';
import { descargarCSV } from '../../utils/descarga';
import { formatearFechaHora, hoyISO, normalizar, tiempoRelativo } from '../../utils/format';
import Alerta from '../../components/Alerta';
import { useToast } from '../../components/ui/Toast';
import { BOTON_SECUNDARIO, CampoBusqueda, Chips, Insignia, Selector } from '../../components/ui/ui';
import { TablaDatos, useTabla } from './comunes';
import { useAdmin } from './contexto';

const TONO_EVENTO = {
  LOGIN_EXITOSO: 'verde', REGISTRO: 'indigo', CAMBIO_PASSWORD: 'azul', CUENTA_ACTIVADA: 'verde', CUENTA_DESBLOQUEADA: 'verde',
  LOGIN_FALLIDO: 'rojo', CUENTA_BLOQUEADA: 'rojo', CUENTA_DESACTIVADA: 'rojo',
  LOGIN_CUENTA_BLOQUEADA: 'naranja', LOGIN_CUENTA_INACTIVA: 'naranja', PASSWORD_RESTABLECIDA: 'ambar',
  VINCULO_CREADO: 'violeta', VINCULO_ELIMINADO: 'gris', SOLICITUD_CREADA: 'azul', SOLICITUD_ACTUALIZADA: 'indigo',
};
const ES_ALERTA = new Set(['LOGIN_FALLIDO', 'CUENTA_BLOQUEADA', 'LOGIN_CUENTA_BLOQUEADA', 'LOGIN_CUENTA_INACTIVA']);

const etiquetaEvento = (e) => e.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function Auditoria({ filtroInicial }) {
  const { auditoria } = useAdmin();
  const toast = useToast();
  const [filtro, setFiltro] = useState(['TODOS', 'ALERTAS', 'FALLIDOS', 'ADMIN'].includes(filtroInicial) ? filtroInicial : 'TODOS');
  const [buscar, setBuscar] = useState('');
  const [evento, setEvento] = useState('TODOS');
  const [rango, setRango] = useState('TODO');

  const lista = auditoria.datos || [];
  const eventos = useMemo(() => [...new Set(lista.map((e) => e.evento))].sort(), [lista]);
  const cuentas = useMemo(() => ({
    TODOS: lista.length,
    ALERTAS: lista.filter((e) => ES_ALERTA.has(e.evento)).length,
    FALLIDOS: lista.filter((e) => e.evento === 'LOGIN_FALLIDO').length,
    ADMIN: lista.filter((e) => (e.detalle || '').startsWith('Acción del administrador')).length,
  }), [lista]);

  const filtrados = useMemo(() => {
    const q = normalizar(buscar);
    const ahora = Date.now();
    const limite = rango === 'HOY' ? 86400000 : rango === 'SEMANA' ? 7 * 86400000 : null;
    return lista.filter((e) => {
      if (filtro === 'ALERTAS' && !ES_ALERTA.has(e.evento)) return false;
      if (filtro === 'FALLIDOS' && e.evento !== 'LOGIN_FALLIDO') return false;
      if (filtro === 'ADMIN' && !(e.detalle || '').startsWith('Acción del administrador')) return false;
      if (evento !== 'TODOS' && e.evento !== evento) return false;
      if (limite && ahora - new Date(e.creadoEn).getTime() > limite) return false;
      return !q || normalizar(`${e.usuario || ''} ${e.identificador || ''} ${e.detalle || ''} ${e.ip || ''} ${e.evento}`).includes(q);
    });
  }, [lista, filtro, buscar, evento, rango]);

  const tabla = useTabla(filtrados, {
    clave: `${filtro}|${buscar}|${evento}|${rango}`,
    porPaginaInicial: 25,
    ordenInicial: { col: 'fecha', dir: 'desc' },
    accesores: { fecha: (e) => e.creadoEn || '', evento: (e) => e.evento, usuario: (e) => e.usuario || e.identificador || '', ip: (e) => e.ip || '' },
  });

  const exportar = () => {
    descargarCSV(`auditoria-${hoyISO()}`, [
      { titulo: 'Fecha', valor: (e) => e.creadoEn || '' },
      { titulo: 'Evento', valor: (e) => e.evento },
      { titulo: 'Usuario', valor: (e) => e.usuario || e.identificador || '' },
      { titulo: 'Detalle', valor: (e) => e.detalle || '' },
      { titulo: 'IP', valor: (e) => e.ip || '' },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} evento(s).`);
  };

  const columnas = [
    { id: 'fecha', titulo: 'Fecha', ordenable: true, render: (e) => (<><p className="font-semibold whitespace-nowrap">{tiempoRelativo(e.creadoEn)}</p><p className="text-xs text-slate-500 whitespace-nowrap">{formatearFechaHora(e.creadoEn)}</p></>) },
    { id: 'evento', titulo: 'Evento', ordenable: true, render: (e) => <Insignia tono={TONO_EVENTO[e.evento] || 'gris'}>{etiquetaEvento(e.evento)}</Insignia> },
    { id: 'usuario', titulo: 'Usuario / identificador', ordenable: true, render: (e) => (e.usuario ? `@${e.usuario}` : e.identificador || '—') },
    { id: 'detalle', titulo: 'Detalle', clase: 'max-w-xs', render: (e) => e.detalle || '—' },
    { id: 'ip', titulo: 'IP', ordenable: true, clase: 'font-mono text-xs', render: (e) => e.ip || '—' },
  ];

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{auditoria.error}</Alerta>
      <div className="flex items-start gap-2 text-xs font-semibold text-slate-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        Se muestran los últimos 100 eventos de seguridad: inicios de sesión, intentos fallidos, bloqueos, registros y acciones del administrador.
      </div>

      <Chips etiqueta="Filtrar eventos" valor={filtro} onCambiar={setFiltro} opciones={[
        { id: 'TODOS', texto: 'Todos', cuenta: cuentas.TODOS },
        { id: 'ALERTAS', texto: 'Alertas', cuenta: cuentas.ALERTAS },
        { id: 'FALLIDOS', texto: 'Logins fallidos', cuenta: cuentas.FALLIDOS },
        { id: 'ADMIN', texto: 'Acciones del admin', cuenta: cuentas.ADMIN },
      ]} />

      <div className="flex flex-col lg:flex-row gap-3">
        <CampoBusqueda id="buscar-auditoria" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por usuario, IP o detalle…" className="flex-1 max-w-xl" />
        <Selector id="filtro-evento" etiqueta="Filtrar por tipo de evento" valor={evento} onCambiar={setEvento} className="lg:w-60">
          <option value="TODOS">Todos los tipos</option>
          {eventos.map((e) => <option key={e} value={e}>{etiquetaEvento(e)}</option>)}
        </Selector>
        <Selector id="filtro-rango" etiqueta="Rango de tiempo" valor={rango} onCambiar={setRango} className="lg:w-44">
          <option value="TODO">Todo el registro</option>
          <option value="HOY">Últimas 24 h</option>
          <option value="SEMANA">Últimos 7 días</option>
        </Selector>
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} lg:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>

      {auditoria.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Bitácora de auditoría" vacio="Sin eventos que coincidan con los filtros." />
      )}
    </div>
  );
}
