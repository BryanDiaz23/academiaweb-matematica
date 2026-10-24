import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { descargarCSV } from '../../utils/descarga';
import { formatearFechaHora, hoyISO, normalizar, tiempoRelativo } from '../../utils/format';
import Alerta from '../../components/Alerta';
import { useToast } from '../../components/ui/Toast';
import { BOTON_SECUNDARIO, CampoBusqueda, Chips, Insignia, Selector } from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { useAdmin } from './contexto';

export default function Solicitudes({ filtroInicial }) {
  const { solicitudes, niveles } = useAdmin();
  const toast = useToast();
  const [filtro, setFiltro] = useState(['PENDIENTES', 'ATENDIDAS', 'TODAS'].includes(filtroInicial) ? filtroInicial : 'PENDIENTES');
  const [buscar, setBuscar] = useState('');
  const [nivel, setNivel] = useState('TODOS');
  const [procesando, setProcesando] = useState(null);

  const lista = solicitudes.datos || [];
  const cuentas = useMemo(() => ({
    PENDIENTES: lista.filter((s) => !s.atendida).length,
    ATENDIDAS: lista.filter((s) => s.atendida).length,
    TODAS: lista.length,
  }), [lista]);

  const filtradas = useMemo(() => {
    const q = normalizar(buscar);
    return lista.filter((s) => {
      if (filtro === 'PENDIENTES' && s.atendida) return false;
      if (filtro === 'ATENDIDAS' && !s.atendida) return false;
      if (nivel !== 'TODOS' && s.nivel !== nivel) return false;
      return !q || normalizar(`${s.nombre} ${s.telefono} ${s.email || ''} ${s.mensaje || ''}`).includes(q);
    });
  }, [lista, filtro, buscar, nivel]);

  const tabla = useTabla(filtradas, {
    clave: `${filtro}|${buscar}|${nivel}`,
    ordenInicial: { col: 'fecha', dir: filtro === 'PENDIENTES' ? 'asc' : 'desc' },
    accesores: { fecha: (s) => s.creadoEn || '', nombre: (s) => s.nombre, nivel: (s) => s.nivel || '' },
  });

  const atender = async (s) => {
    setProcesando(s.id);
    try {
      await api(`/api/admin/solicitudes/${s.id}/atendida`, { method: 'PATCH' });
      await solicitudes.recargar();
      toast.exito(`Solicitud de ${s.nombre} marcada como atendida.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const enlaceWhatsApp = (s) => {
    const telefono = s.telefono.replace(/\D/g, '');
    const texto = `¡Hola ${s.nombre.split(' ')[0]}! Te escribimos de Matemática Sin Estrés por tu solicitud de clase de diagnóstico${s.nivel ? ` (${s.nivel})` : ''}. ¿Qué día y horario te conviene?`;
    return `https://wa.me/${telefono.startsWith('51') && telefono.length > 9 ? telefono : `51${telefono}`}?text=${encodeURIComponent(texto)}`;
  };

  const exportar = () => {
    descargarCSV(`solicitudes-${hoyISO()}`, [
      { titulo: 'Fecha', valor: (s) => s.creadoEn || '' },
      { titulo: 'Nombre', valor: (s) => s.nombre },
      { titulo: 'Teléfono', valor: (s) => s.telefono },
      { titulo: 'Correo', valor: (s) => s.email || '' },
      { titulo: 'Nivel', valor: (s) => s.nivel || '' },
      { titulo: 'Mensaje', valor: (s) => s.mensaje || '' },
      { titulo: 'Atendida', valor: (s) => (s.atendida ? 'Sí' : 'No') },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} solicitud(es).`);
  };

  const columnas = [
    { id: 'fecha', titulo: 'Recibida', ordenable: true, render: (s) => (<><p className="font-semibold whitespace-nowrap">{tiempoRelativo(s.creadoEn)}</p><p className="text-xs text-slate-500 whitespace-nowrap">{formatearFechaHora(s.creadoEn)}</p></>) },
    {
      id: 'nombre', titulo: 'Contacto', ordenable: true,
      render: (s) => (
        <>
          <p className="font-bold text-slate-900">{s.nombre}</p>
          <p className="text-xs text-slate-500">{s.telefono}</p>
          {s.email && <p className="text-xs text-slate-500">{s.email}</p>}
        </>
      ),
    },
    { id: 'nivel', titulo: 'Nivel', ordenable: true, render: (s) => (s.nivel ? <Insignia tono="indigo">{s.nivel}</Insignia> : <span className="text-slate-400">—</span>) },
    { id: 'mensaje', titulo: 'Mensaje', clase: 'max-w-xs', render: (s) => s.mensaje || <span className="text-slate-400">—</span> },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (s) => (
        <div className="flex flex-wrap gap-1.5 items-center">
          <a href={enlaceWhatsApp(s)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> Escribir
          </a>
          {s.atendida
            ? <Insignia tono="verde"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Atendida</Insignia>
            : <BotonFila tono="indigo" icono={CheckCircle2} disabled={procesando === s.id} onClick={() => atender(s)}>Marcar atendida</BotonFila>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{solicitudes.error}</Alerta>
      <Chips etiqueta="Filtrar solicitudes" valor={filtro} onCambiar={setFiltro} opciones={[
        { id: 'PENDIENTES', texto: 'Pendientes', cuenta: cuentas.PENDIENTES },
        { id: 'ATENDIDAS', texto: 'Atendidas', cuenta: cuentas.ATENDIDAS },
        { id: 'TODAS', texto: 'Todas', cuenta: cuentas.TODAS },
      ]} />
      <div className="flex flex-col sm:flex-row gap-3">
        <CampoBusqueda id="buscar-solicitudes" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por nombre, teléfono o mensaje…" className="flex-1 max-w-xl" />
        <Selector id="filtro-nivel-sol" etiqueta="Filtrar por nivel" valor={nivel} onCambiar={setNivel} className="sm:w-56">
          <option value="TODOS">Todos los niveles</option>
          {(niveles.datos || []).map((n) => <option key={n.id} value={n.nombre}>{n.nombre}</option>)}
        </Selector>
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} sm:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>
      {solicitudes.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Solicitudes" vacio={filtro === 'PENDIENTES' && lista.length > 0 ? '¡Todo atendido! No hay solicitudes pendientes.' : 'No hay solicitudes que coincidan con los filtros.'} />
      )}
    </div>
  );
}
