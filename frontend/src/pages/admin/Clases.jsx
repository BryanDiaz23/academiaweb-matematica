import React, { useMemo, useState } from 'react';
import { BookOpen, Copy, Download, ExternalLink, Eye, Heart, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { descargarCSV } from '../../utils/descarga';
import { formatearDuracion, formatearFecha, hoyISO, normalizar, urlSegura } from '../../utils/format';
import Alerta from '../../components/Alerta';
import { Confirmar, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  BOTON_PRIMARIO, BOTON_SECUNDARIO, CampoBusqueda, Chips, CLASE_ETIQUETA, CLASE_INPUT, Insignia, Interruptor, Selector, StatCard, TONO_NIVEL,
} from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { useAdmin } from './contexto';

const VACIA = { titulo: '', descripcion: '', nivelId: '', duracionMinutos: 90, fechaClase: '', urlVideo: '', urlPizarra: '', publicada: true };
const ES_HTTPS = /^https:\/\/[^\s<>"']+$/i;

function aCuerpo(c, cambios = {}) {
  return {
    titulo: c.titulo,
    descripcion: c.descripcion || '',
    nivelId: Number(c.nivelId),
    duracionMinutos: Number(c.duracionMinutos),
    fechaClase: c.fechaClase,
    urlVideo: c.urlVideo,
    urlPizarra: c.urlPizarra || '',
    publicada: c.publicada,
    ...cambios,
  };
}

function FormularioClase({ abierto, edicion, inicial, niveles, onCerrar, onGuardada }) {
  const [form, setForm] = useState(inicial);
  const [estado, setEstado] = useState({ cargando: false, error: '', detalles: [] });
  const [errores, setErrores] = useState({});

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errores[name]) setErrores({ ...errores, [name]: '' });
  };

  const validar = () => {
    const e = {};
    if (!form.titulo.trim()) e.titulo = 'Escribe un título.';
    if (!form.nivelId) e.nivelId = 'Elige un nivel.';
    if (!form.fechaClase) e.fechaClase = 'Indica la fecha de la clase.';
    if (!(Number(form.duracionMinutos) >= 1 && Number(form.duracionMinutos) <= 600)) e.duracionMinutos = 'Entre 1 y 600 minutos.';
    if (!ES_HTTPS.test(form.urlVideo.trim())) e.urlVideo = 'Debe ser un enlace seguro que empiece con https://';
    if (form.urlPizarra.trim() && !ES_HTTPS.test(form.urlPizarra.trim())) e.urlPizarra = 'Debe empezar con https://';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    if (!validar()) return;
    setEstado({ cargando: true, error: '', detalles: [] });
    try {
      const cuerpo = aCuerpo({ ...form, titulo: form.titulo.trim(), urlVideo: form.urlVideo.trim(), urlPizarra: form.urlPizarra.trim() });
      if (edicion) await api(`/api/admin/clases/${edicion}`, { method: 'PUT', body: cuerpo });
      else await api('/api/admin/clases', { method: 'POST', body: cuerpo });
      onGuardada(Boolean(edicion));
    } catch (err) {
      setEstado({ cargando: false, error: err.message, detalles: err.detalles || [] });
    }
  };

  const MsgError = ({ campo }) => (errores[campo] ? <p className="text-xs font-bold text-red-600 mt-1">{errores[campo]}</p> : null);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={edicion ? 'Editar clase' : 'Nueva clase grabada'} ancho="md"
      pie={(
        <>
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cancelar</button>
          <button type="submit" form="form-clase" disabled={estado.cargando} className={BOTON_PRIMARIO}>{estado.cargando ? 'Guardando…' : 'Guardar clase'}</button>
        </>
      )}>
      <form id="form-clase" onSubmit={guardar} className="space-y-4" noValidate>
        <Alerta tipo="error" detalles={estado.detalles}>{estado.error}</Alerta>
        <div>
          <label htmlFor="titulo" className={CLASE_ETIQUETA}>Título</label>
          <input id="titulo" name="titulo" data-autofocus value={form.titulo} onChange={cambiar} maxLength={150} className={CLASE_INPUT} />
          <MsgError campo="titulo" />
        </div>
        <div>
          <label htmlFor="descripcion" className={CLASE_ETIQUETA}>Descripción <span className="normal-case font-medium text-slate-400">({form.descripcion.length}/500)</span></label>
          <textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={cambiar} maxLength={500} rows={2} className={CLASE_INPUT} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nivelIdClase" className={CLASE_ETIQUETA}>Nivel</label>
            <select id="nivelIdClase" name="nivelId" value={form.nivelId} onChange={cambiar} className={CLASE_INPUT}>
              <option value="">Selecciona…</option>
              {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
            </select>
            <MsgError campo="nivelId" />
          </div>
          <div>
            <label htmlFor="fechaClase" className={CLASE_ETIQUETA}>Fecha</label>
            <input id="fechaClase" name="fechaClase" type="date" value={form.fechaClase} onChange={cambiar} className={CLASE_INPUT} />
            <MsgError campo="fechaClase" />
          </div>
          <div>
            <label htmlFor="duracionMinutos" className={CLASE_ETIQUETA}>Duración (min)</label>
            <input id="duracionMinutos" name="duracionMinutos" type="number" min={1} max={600} value={form.duracionMinutos} onChange={cambiar} className={CLASE_INPUT} />
            <MsgError campo="duracionMinutos" />
          </div>
        </div>
        <div>
          <label htmlFor="urlVideo" className={CLASE_ETIQUETA}>Enlace del video (https://)</label>
          <input id="urlVideo" name="urlVideo" type="url" value={form.urlVideo} onChange={cambiar} maxLength={300} placeholder="https://drive.google.com/…" className={CLASE_INPUT} />
          <MsgError campo="urlVideo" />
          {urlSegura(form.urlVideo.trim()) && (
            <a href={form.urlVideo.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline mt-1.5">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> Probar enlace
            </a>
          )}
        </div>
        <div>
          <label htmlFor="urlPizarra" className={CLASE_ETIQUETA}>Pizarra en PDF (opcional)</label>
          <input id="urlPizarra" name="urlPizarra" type="url" value={form.urlPizarra} onChange={cambiar} maxLength={300} placeholder="https://…" className={CLASE_INPUT} />
          <MsgError campo="urlPizarra" />
        </div>
        <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
          <input type="checkbox" name="publicada" checked={form.publicada} onChange={cambiar} className="w-4 h-4 mt-0.5" />
          <span>
            <span className="block text-sm font-extrabold text-slate-800">Publicada</span>
            <span className="block text-xs font-medium text-slate-500">Visible para los alumnos con matrícula activa en el nivel. Desmárcala para dejarla como borrador.</span>
          </span>
        </label>
      </form>
    </Modal>
  );
}

export default function Clases({ filtroInicial }) {
  const { clases, niveles } = useAdmin();
  const toast = useToast();
  const [filtro, setFiltro] = useState(['TODAS', 'PUBLICADAS', 'OCULTAS'].includes(filtroInicial) ? filtroInicial : 'TODAS');
  const [buscar, setBuscar] = useState('');
  const [nivel, setNivel] = useState('TODOS');
  const [formulario, setFormulario] = useState(null); // { edicion, inicial }
  const [aEliminar, setAEliminar] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const lista = clases.datos || [];
  const cuentas = useMemo(() => ({
    TODAS: lista.length,
    PUBLICADAS: lista.filter((c) => c.publicada).length,
    OCULTAS: lista.filter((c) => !c.publicada).length,
  }), [lista]);
  const totalVistas = lista.reduce((s, c) => s + (c.vistas || 0), 0);
  const totalMinutos = lista.reduce((s, c) => s + c.duracionMinutos, 0);

  const filtradas = useMemo(() => {
    const q = normalizar(buscar);
    return lista.filter((c) => {
      if (filtro === 'PUBLICADAS' && !c.publicada) return false;
      if (filtro === 'OCULTAS' && c.publicada) return false;
      if (nivel !== 'TODOS' && String(c.nivelId) !== nivel) return false;
      return !q || normalizar(`${c.titulo} ${c.descripcion || ''} ${c.nivel}`).includes(q);
    });
  }, [lista, filtro, buscar, nivel]);

  const tabla = useTabla(filtradas, {
    clave: `${filtro}|${buscar}|${nivel}`,
    ordenInicial: { col: 'fecha', dir: 'desc' },
    accesores: { titulo: (c) => c.titulo, nivel: (c) => c.nivel, fecha: (c) => c.fechaClase, vistas: (c) => c.vistas || 0, estado: (c) => (c.publicada ? 1 : 0) },
  });

  const nueva = () => setFormulario({ edicion: null, inicial: { ...VACIA, fechaClase: hoyISO() } });
  const editar = (c) => setFormulario({
    edicion: c.id,
    inicial: { titulo: c.titulo, descripcion: c.descripcion || '', nivelId: String(c.nivelId), duracionMinutos: c.duracionMinutos, fechaClase: c.fechaClase, urlVideo: c.urlVideo, urlPizarra: c.urlPizarra || '', publicada: c.publicada },
  });
  const duplicar = (c) => setFormulario({
    edicion: null,
    inicial: { titulo: `${c.titulo} (copia)`.slice(0, 150), descripcion: c.descripcion || '', nivelId: String(c.nivelId), duracionMinutos: c.duracionMinutos, fechaClase: hoyISO(), urlVideo: c.urlVideo, urlPizarra: c.urlPizarra || '', publicada: false },
  });

  const alternarPublicada = async (c) => {
    try {
      await api(`/api/admin/clases/${c.id}`, { method: 'PUT', body: aCuerpo(c, { publicada: !c.publicada }) });
      await clases.recargar();
      toast.exito(c.publicada ? `"${c.titulo}" ahora está oculta para los alumnos.` : `"${c.titulo}" publicada.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const eliminar = async () => {
    setProcesando(true);
    try {
      await api(`/api/admin/clases/${aEliminar.id}`, { method: 'DELETE' });
      await clases.recargar();
      toast.exito(`Clase "${aEliminar.titulo}" eliminada.`);
      setAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const exportar = () => {
    descargarCSV(`clases-${hoyISO()}`, [
      { titulo: 'Título', valor: (c) => c.titulo },
      { titulo: 'Nivel', valor: (c) => c.nivel },
      { titulo: 'Fecha', valor: (c) => c.fechaClase },
      { titulo: 'Duración (min)', valor: (c) => c.duracionMinutos },
      { titulo: 'Publicada', valor: (c) => (c.publicada ? 'Sí' : 'No') },
      { titulo: 'Vistas', valor: (c) => c.vistas || 0 },
      { titulo: 'Favoritas', valor: (c) => c.favoritas || 0 },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} clase(s).`);
  };

  const columnas = [
    {
      id: 'titulo', titulo: 'Clase', ordenable: true, clase: 'max-w-sm',
      render: (c) => {
        const video = urlSegura(c.urlVideo);
        return (
          <>
            <p className="font-bold text-slate-900">{c.titulo}</p>
            {c.descripcion && <p className="text-xs text-slate-500 line-clamp-1">{c.descripcion}</p>}
            {video && <a href={video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline mt-0.5"><ExternalLink className="w-3 h-3" aria-hidden="true" /> Abrir video</a>}
          </>
        );
      },
    },
    { id: 'nivel', titulo: 'Nivel', ordenable: true, render: (c) => <Insignia tono={TONO_NIVEL[c.nivelCodigo] || 'gris'}>{c.nivel}</Insignia> },
    { id: 'fecha', titulo: 'Fecha / duración', ordenable: true, render: (c) => (<><p className="whitespace-nowrap">{formatearFecha(c.fechaClase)}</p><p className="text-xs text-slate-500">{formatearDuracion(c.duracionMinutos)}</p></>) },
    {
      id: 'vistas', titulo: 'Interés', ordenable: true,
      render: (c) => (
        <div className="flex flex-col gap-1 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5" title="Alumnos que la marcaron como vista"><Eye className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" /> {c.vistas || 0} vista(s)</span>
          <span className="inline-flex items-center gap-1.5" title="Alumnos que la guardaron como favorita"><Heart className="w-3.5 h-3.5 text-pink-500" aria-hidden="true" /> {c.favoritas || 0}</span>
        </div>
      ),
    },
    {
      id: 'estado', titulo: 'Publicada', ordenable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <Interruptor activo={c.publicada} onCambiar={() => alternarPublicada(c)} etiqueta={c.publicada ? `Ocultar ${c.titulo}` : `Publicar ${c.titulo}`} />
          <span className={`text-xs font-extrabold ${c.publicada ? 'text-emerald-700' : 'text-slate-500'}`}>{c.publicada ? 'Visible' : 'Oculta'}</span>
        </div>
      ),
    },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (c) => (
        <div className="flex flex-wrap gap-1.5">
          <BotonFila tono="indigo" icono={Pencil} onClick={() => editar(c)}>Editar</BotonFila>
          <BotonFila tono="gris" icono={Copy} onClick={() => duplicar(c)}>Duplicar</BotonFila>
          <BotonFila tono="rojo" icono={Trash2} onClick={() => setAEliminar(c)}>Eliminar</BotonFila>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{clases.error}</Alerta>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icono={BookOpen} etiqueta="Clases" valor={cuentas.TODAS} tono="indigo" nota={`${formatearDuracion(totalMinutos) || '0 min'} de contenido`} />
        <StatCard icono={Eye} etiqueta="Publicadas" valor={cuentas.PUBLICADAS} tono="verde" nota="Visibles para alumnos" />
        <StatCard icono={Pencil} etiqueta="Borradores" valor={cuentas.OCULTAS} tono="gris" nota="Ocultas" />
        <StatCard icono={Heart} etiqueta="Visualizaciones" valor={totalVistas} tono="rosa" nota="Marcadas como vistas" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Chips etiqueta="Filtrar por visibilidad" valor={filtro} onCambiar={setFiltro} opciones={[
          { id: 'TODAS', texto: 'Todas', cuenta: cuentas.TODAS },
          { id: 'PUBLICADAS', texto: 'Publicadas', cuenta: cuentas.PUBLICADAS },
          { id: 'OCULTAS', texto: 'Ocultas', cuenta: cuentas.OCULTAS },
        ]} />
        <button type="button" onClick={nueva} className={BOTON_PRIMARIO}><Plus className="w-4 h-4" aria-hidden="true" /> Nueva clase</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <CampoBusqueda id="buscar-clases-admin" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por título, descripción o nivel…" className="flex-1 max-w-xl" />
        <Selector id="filtro-nivel-clase" etiqueta="Filtrar por nivel" valor={nivel} onCambiar={setNivel} className="sm:w-56">
          <option value="TODOS">Todos los niveles</option>
          {(niveles.datos || []).map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </Selector>
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} sm:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>

      {clases.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Clases grabadas" vacio={lista.length === 0 ? 'Aún no hay clases. Crea la primera con "Nueva clase".' : 'No hay clases que coincidan con los filtros.'} />
      )}

      {formulario && (
        <FormularioClase abierto key={formulario.edicion || 'nueva'} edicion={formulario.edicion} inicial={formulario.inicial} niveles={niveles.datos || []}
          onCerrar={() => setFormulario(null)}
          onGuardada={async (eraEdicion) => {
            setFormulario(null);
            await clases.recargar();
            toast.exito(eraEdicion ? 'Clase actualizada.' : 'Clase creada.');
          }} />
      )}

      <Confirmar abierto={Boolean(aEliminar)} peligro cargando={procesando} titulo="Eliminar clase"
        mensaje={`¿Eliminar "${aEliminar?.titulo}"? Se borrará también el progreso y los favoritos de los alumnos en esta clase. Esta acción no se puede deshacer. Si solo quieres retirarla, mejor ocúltala.`}
        textoConfirmar="Sí, eliminar" onCancelar={() => setAEliminar(null)} onConfirmar={eliminar} />
    </div>
  );
}
