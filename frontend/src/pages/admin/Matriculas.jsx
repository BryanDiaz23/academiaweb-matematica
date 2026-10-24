import React, { useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Download, Plus, RotateCcw, X } from 'lucide-react';
import { api } from '../../api/client';
import { descargarCSV } from '../../utils/descarga';
import { diasHasta, formatearFecha, hoyISO, normalizar, sumarMesesISO, textoDias } from '../../utils/format';
import Alerta from '../../components/Alerta';
import { Confirmar, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  Avatar, BOTON_PRIMARIO, BOTON_SECUNDARIO, CampoBusqueda, Chips, CLASE_ETIQUETA, CLASE_INPUT, Insignia, Selector, TONO_ESTADO_MATRICULA,
} from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { estadoEfectivo, useAdmin } from './contexto';

const FILTROS_VALIDOS = ['TODAS', 'PENDIENTE', 'ACTIVA', 'POR_VENCER', 'VENCIDA', 'ANULADA'];

function FormularioNueva({ abierto, onCerrar, onCreada }) {
  const { usuarios, niveles, horarios, matriculas } = useAdmin();
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState({ usuarioId: '', nivelId: '', horarioId: '', meses: '1' });
  const [estado, setEstado] = useState({ cargando: false, error: '' });

  const alumnos = useMemo(() => {
    const q = normalizar(buscar);
    return (usuarios.datos || [])
      .filter((u) => u.rol === 'ALUMNO' && u.activo)
      .filter((u) => !q || normalizar(`${u.nombreCompleto} ${u.username} ${u.email}`).includes(q))
      .slice(0, 60);
  }, [usuarios.datos, buscar]);

  // Niveles en los que el alumno elegido ya tiene matrícula pendiente o activa
  const ocupados = useMemo(() => new Set(
    (matriculas.datos || [])
      .filter((m) => String(m.usuarioId) === form.usuarioId && ['PENDIENTE', 'ACTIVA'].includes(estadoEfectivo(m)))
      .map((m) => m.nivelId)
  ), [matriculas.datos, form.usuarioId]);

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.usuarioId || !form.nivelId || !form.horarioId) {
      setEstado({ cargando: false, error: 'Elige el alumno, el nivel y el turno.' });
      return;
    }
    setEstado({ cargando: true, error: '' });
    try {
      const creada = await api('/api/admin/matriculas', {
        method: 'POST',
        body: { usuarioId: Number(form.usuarioId), nivelId: Number(form.nivelId), horarioId: Number(form.horarioId), meses: Number(form.meses) },
      });
      setForm({ usuarioId: '', nivelId: '', horarioId: '', meses: '1' });
      setBuscar('');
      setEstado({ cargando: false, error: '' });
      onCreada(creada);
    } catch (err) {
      setEstado({ cargando: false, error: err.message });
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva matrícula" descripcion="Para cuando el alumno paga directamente: queda activa desde hoy."
      pie={(
        <>
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cancelar</button>
          <button type="submit" form="form-nueva-matricula" disabled={estado.cargando} className={BOTON_PRIMARIO}>{estado.cargando ? 'Creando…' : 'Crear matrícula'}</button>
        </>
      )}>
      <form id="form-nueva-matricula" onSubmit={enviar} className="space-y-4">
        <Alerta tipo="error">{estado.error}</Alerta>
        <div>
          <label htmlFor="nm-buscar" className={CLASE_ETIQUETA}>Alumno</label>
          <input id="nm-buscar" data-autofocus value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe para buscar por nombre, usuario o correo…" className={CLASE_INPUT} />
          <label htmlFor="nm-alumno" className="sr-only">Resultados de alumnos</label>
          <select id="nm-alumno" name="usuarioId" size={5} value={form.usuarioId} onChange={cambiar} className={`${CLASE_INPUT} mt-2`}>
            {alumnos.length === 0 && <option disabled value="">No hay alumnos que coincidan</option>}
            {alumnos.map((u) => <option key={u.id} value={u.id}>{u.nombreCompleto} (@{u.username})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nm-nivel" className={CLASE_ETIQUETA}>Nivel</label>
            <select id="nm-nivel" name="nivelId" value={form.nivelId} onChange={cambiar} className={CLASE_INPUT}>
              <option value="">Selecciona…</option>
              {(niveles.datos || []).map((n) => <option key={n.id} value={n.id} disabled={ocupados.has(n.id)}>{n.nombre}{ocupados.has(n.id) ? ' (ya tiene una)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="nm-horario" className={CLASE_ETIQUETA}>Turno</label>
            <select id="nm-horario" name="horarioId" value={form.horarioId} onChange={cambiar} className={CLASE_INPUT}>
              <option value="">Selecciona…</option>
              {(horarios.datos || []).map((h) => <option key={h.id} value={h.id}>{h.turno} ({h.horaInicio} – {h.horaFin})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="nm-meses" className={CLASE_ETIQUETA}>Vigencia</label>
          <select id="nm-meses" name="meses" value={form.meses} onChange={cambiar} className={CLASE_INPUT}>
            {[1, 2, 3, 6, 12].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'mes' : 'meses'} (hasta {formatearFecha(sumarMesesISO(hoyISO(), n))})</option>)}
          </select>
        </div>
      </form>
    </Modal>
  );
}

export default function Matriculas({ filtroInicial }) {
  const { matriculas, niveles, recargarTodo } = useAdmin();
  const toast = useToast();
  const hoy = hoyISO();
  const [filtro, setFiltro] = useState(FILTROS_VALIDOS.includes(filtroInicial) ? filtroInicial : 'TODAS');
  const [buscar, setBuscar] = useState('');
  const [nivel, setNivel] = useState('TODOS');
  const [procesando, setProcesando] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [nuevaAbierta, setNuevaAbierta] = useState(false);

  const filas = useMemo(
    () => (matriculas.datos || []).map((m) => ({ ...m, efectivo: estadoEfectivo(m, hoy), dias: m.fechaFin ? diasHasta(m.fechaFin) : null })),
    [matriculas.datos, hoy]
  );

  const cuentas = useMemo(() => ({
    TODAS: filas.length,
    PENDIENTE: filas.filter((m) => m.efectivo === 'PENDIENTE').length,
    ACTIVA: filas.filter((m) => m.efectivo === 'ACTIVA').length,
    POR_VENCER: filas.filter((m) => m.efectivo === 'ACTIVA' && m.dias !== null && m.dias <= 7).length,
    VENCIDA: filas.filter((m) => m.efectivo === 'VENCIDA').length,
    ANULADA: filas.filter((m) => m.efectivo === 'ANULADA').length,
  }), [filas]);

  const filtradas = useMemo(() => {
    const q = normalizar(buscar);
    return filas.filter((m) => {
      if (filtro === 'POR_VENCER' ? !(m.efectivo === 'ACTIVA' && m.dias !== null && m.dias <= 7) : filtro !== 'TODAS' && m.efectivo !== filtro) return false;
      if (nivel !== 'TODOS' && String(m.nivelId) !== nivel) return false;
      return !q || normalizar(`${m.alumno} ${m.username} ${m.nivel} ${m.horario}`).includes(q);
    });
  }, [filas, filtro, buscar, nivel]);

  const tabla = useTabla(filtradas, {
    clave: `${filtro}|${buscar}|${nivel}`,
    ordenInicial: filtro === 'POR_VENCER' ? { col: 'fin', dir: 'asc' } : { col: 'creado', dir: 'desc' },
    accesores: {
      alumno: (m) => m.alumno,
      nivel: (m) => m.nivel,
      fin: (m) => m.fechaFin || '',
      estado: (m) => m.efectivo,
      creado: (m) => m.creadoEn || '',
    },
  });

  const aplicar = async (m, cuerpo, mensajeExito) => {
    setProcesando(m.id);
    try {
      await api(`/api/admin/matriculas/${m.id}`, { method: 'PATCH', body: cuerpo });
      await matriculas.recargar();
      toast.exito(mensajeExito);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(null);
      setConfirmacion(null);
    }
  };

  const activar = (m) => aplicar(m, { estado: 'ACTIVA' }, `Matrícula de ${m.alumno} ${m.efectivo === 'PENDIENTE' ? 'activada' : 'renovada'} por 1 mes.`);
  const extender = (m) => {
    const base = m.fechaFin && m.fechaFin > hoy ? m.fechaFin : hoy;
    const nuevoFin = sumarMesesISO(base, 1);
    return aplicar(m, { estado: 'ACTIVA', fechaFin: nuevoFin }, `Vigencia de ${m.alumno} extendida hasta el ${formatearFecha(nuevoFin)}.`);
  };

  const exportar = () => {
    descargarCSV(`matriculas-${hoy}`, [
      { titulo: 'Alumno', valor: (m) => m.alumno },
      { titulo: 'Usuario', valor: (m) => m.username },
      { titulo: 'Nivel', valor: (m) => m.nivel },
      { titulo: 'Turno', valor: (m) => m.horario },
      { titulo: 'Estado', valor: (m) => m.efectivo },
      { titulo: 'Inicio', valor: (m) => m.fechaInicio || '' },
      { titulo: 'Fin', valor: (m) => m.fechaFin || '' },
      { titulo: 'Días restantes', valor: (m) => (m.efectivo === 'ACTIVA' && m.dias !== null ? m.dias : '') },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} matrícula(s).`);
  };

  const columnas = [
    {
      id: 'alumno', titulo: 'Alumno', ordenable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={m.alumno} tamano="sm" />
          <div><p className="font-bold text-slate-900">{m.alumno}</p><p className="text-xs text-slate-500">@{m.username}</p></div>
        </div>
      ),
    },
    { id: 'nivel', titulo: 'Nivel / turno', ordenable: true, render: (m) => (<><p className="font-semibold">{m.nivel}</p><p className="text-xs text-slate-500">{m.horario}</p></>) },
    {
      id: 'fin', titulo: 'Vigencia', ordenable: true,
      render: (m) => (m.fechaInicio ? (
        <>
          <p className="whitespace-nowrap">{formatearFecha(m.fechaInicio)} – {formatearFecha(m.fechaFin)}</p>
          {m.efectivo === 'ACTIVA' && m.dias !== null && (
            <p className={`text-xs font-bold mt-0.5 ${m.dias <= 2 ? 'text-red-600' : m.dias <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>{textoDias(m.dias)}</p>
          )}
        </>
      ) : <span className="text-slate-400">—</span>),
    },
    { id: 'estado', titulo: 'Estado', ordenable: true, render: (m) => <Insignia tono={TONO_ESTADO_MATRICULA[m.efectivo] || 'gris'}>{m.efectivo}</Insignia> },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (m) => (
        <div className="flex flex-wrap gap-1.5">
          {m.efectivo === 'PENDIENTE' && <BotonFila tono="verde" icono={CheckCircle2} disabled={procesando === m.id} onClick={() => activar(m)}>Activar</BotonFila>}
          {m.efectivo === 'VENCIDA' && <BotonFila tono="verde" icono={RotateCcw} disabled={procesando === m.id} onClick={() => activar(m)}>Renovar 1 mes</BotonFila>}
          {m.efectivo === 'ANULADA' && <BotonFila tono="indigo" icono={RotateCcw} disabled={procesando === m.id} onClick={() => activar(m)}>Reactivar</BotonFila>}
          {m.efectivo === 'ACTIVA' && (
            <>
              <BotonFila tono="indigo" icono={CalendarPlus} disabled={procesando === m.id} onClick={() => extender(m)}>+1 mes</BotonFila>
              <BotonFila tono="gris" disabled={procesando === m.id} onClick={() => setConfirmacion({ m, accion: 'vencer' })}>Marcar vencida</BotonFila>
            </>
          )}
          {m.efectivo !== 'ANULADA' && <BotonFila tono="rojo" icono={X} disabled={procesando === m.id} onClick={() => setConfirmacion({ m, accion: 'anular' })}>Anular</BotonFila>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{matriculas.error}</Alerta>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chips etiqueta="Filtrar por estado" valor={filtro} onCambiar={setFiltro} opciones={[
          { id: 'TODAS', texto: 'Todas', cuenta: cuentas.TODAS },
          { id: 'PENDIENTE', texto: 'Pendientes', cuenta: cuentas.PENDIENTE },
          { id: 'ACTIVA', texto: 'Activas', cuenta: cuentas.ACTIVA },
          { id: 'POR_VENCER', texto: 'Por vencer', cuenta: cuentas.POR_VENCER },
          { id: 'VENCIDA', texto: 'Vencidas', cuenta: cuentas.VENCIDA },
          { id: 'ANULADA', texto: 'Anuladas', cuenta: cuentas.ANULADA },
        ]} />
        <button type="button" onClick={() => setNuevaAbierta(true)} className={BOTON_PRIMARIO}><Plus className="w-4 h-4" aria-hidden="true" /> Nueva matrícula</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <CampoBusqueda id="buscar-matriculas" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por alumno, usuario, nivel o turno…" className="flex-1 max-w-xl" />
        <Selector id="filtro-nivel-mat" etiqueta="Filtrar por nivel" valor={nivel} onCambiar={setNivel} className="sm:w-56">
          <option value="TODOS">Todos los niveles</option>
          {(niveles.datos || []).map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </Selector>
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} sm:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>

      {matriculas.datos === null ? (
        <p className="text-sm font-semibold text-slate-500">Cargando…</p>
      ) : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Matrículas" vacio={filas.length === 0 ? 'Todavía no hay matrículas.' : 'No hay matrículas que coincidan con los filtros.'} />
      )}

      <FormularioNueva abierto={nuevaAbierta} onCerrar={() => setNuevaAbierta(false)}
        onCreada={async (creada) => {
          setNuevaAbierta(false);
          await recargarTodo();
          toast.exito(`Matrícula creada: ${creada.alumno} · ${creada.nivel} hasta el ${formatearFecha(creada.fechaFin)}.`);
        }} />

      <Confirmar abierto={Boolean(confirmacion)} peligro cargando={procesando !== null}
        titulo={confirmacion?.accion === 'anular' ? 'Anular matrícula' : 'Marcar como vencida'}
        mensaje={confirmacion?.accion === 'anular'
          ? `Se anulará la matrícula de ${confirmacion?.m.alumno} (${confirmacion?.m.nivel}) y perderá el acceso a las clases. Podrás reactivarla después.`
          : `${confirmacion?.m.alumno} perderá el acceso a las clases de ${confirmacion?.m.nivel} hasta que la renueves.`}
        textoConfirmar={confirmacion?.accion === 'anular' ? 'Sí, anular' : 'Sí, marcar vencida'}
        onCancelar={() => setConfirmacion(null)}
        onConfirmar={() => aplicar(confirmacion.m, { estado: confirmacion.accion === 'anular' ? 'ANULADA' : 'VENCIDA' },
          confirmacion.accion === 'anular' ? `Matrícula de ${confirmacion.m.alumno} anulada.` : `Matrícula de ${confirmacion.m.alumno} marcada como vencida.`)} />
    </div>
  );
}
