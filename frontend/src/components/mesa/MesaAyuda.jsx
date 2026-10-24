import React, { useState } from 'react';
import { CheckCircle2, Clock, Inbox, LifeBuoy, MessageSquareText, Plus, Send } from 'lucide-react';
import { api } from '../../api/client';
import { useDatos } from '../../hooks/useDatos';
import { formatearFechaHora, tiempoRelativo } from '../../utils/format';
import { describirEstado, describirPrioridad, describirSla, esPendiente, textoSla, tiempoRestante, validarSolicitud } from '../../utils/mesaAyuda';
import Alerta from '../Alerta';
import { Confirmar, Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CLASE_ETIQUETA, CLASE_INPUT, EstadoVacio, Esqueleto, Insignia, Tarjeta, TituloSeccion } from '../ui/ui';

const VACIO = { tipo: '', asunto: '', descripcion: '' };

function FormularioSolicitud({ abierto, catalogo, tipoInicial, onCerrar, onCreada }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...VACIO, tipo: tipoInicial || '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');
  const elegido = catalogo.find((c) => c.tipo === form.tipo);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validarSolicitud(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    setErrorServidor('');
    try {
      const creada = await api('/api/mesa-ayuda/solicitudes', { method: 'POST', body: { ...form, asunto: form.asunto.trim(), descripcion: form.descripcion.trim() } });
      toast.exito(`Registramos tu solicitud ${creada.codigo}. Te responderemos en un máximo de ${textoSla(creada.horasSla)}.`);
      onCreada(creada);
    } catch (err) {
      setErrorServidor(err.detalles?.length ? `${err.message}: ${err.detalles.join(' · ')}` : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nueva solicitud" descripcion="Cuéntanos qué necesitas. Cada tipo tiene un tiempo máximo de atención."
      pie={(
        <>
          <button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cancelar</button>
          <button type="submit" form="form-solicitud" disabled={enviando} className={BOTON_PRIMARIO}>
            <Send className="w-4 h-4" aria-hidden="true" /> {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </>
      )}>
      <form id="form-solicitud" onSubmit={enviar} noValidate className="space-y-4">
        <Alerta tipo="error">{errorServidor}</Alerta>
        <div>
          <label htmlFor="sol-tipo" className={CLASE_ETIQUETA}>Tipo de solicitud</label>
          <select id="sol-tipo" value={form.tipo} onChange={cambiar('tipo')} className={CLASE_INPUT} data-autofocus aria-invalid={!!errores.tipo}>
            <option value="">Elige una opción…</option>
            {catalogo.map((c) => <option key={c.tipo} value={c.tipo}>{c.nombre}</option>)}
          </select>
          {errores.tipo && <p className="text-xs font-semibold text-red-600 mt-1">{errores.tipo}</p>}
          {elegido && (
            <p className="text-xs font-semibold text-slate-500 mt-1.5">
              {elegido.descripcion} Prioridad {describirPrioridad(elegido.prioridad).etiqueta.toLowerCase()} · atención en máximo {textoSla(elegido.horasSla)}.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="sol-asunto" className={CLASE_ETIQUETA}>Asunto</label>
          <input id="sol-asunto" value={form.asunto} onChange={cambiar('asunto')} maxLength={120} className={CLASE_INPUT}
            placeholder="Ej.: No puedo ver la clase de fracciones" aria-invalid={!!errores.asunto} />
          {errores.asunto && <p className="text-xs font-semibold text-red-600 mt-1">{errores.asunto}</p>}
        </div>
        <div>
          <label htmlFor="sol-descripcion" className={CLASE_ETIQUETA}>Detalle</label>
          <textarea id="sol-descripcion" value={form.descripcion} onChange={cambiar('descripcion')} maxLength={1000} rows={5} className={CLASE_INPUT}
            placeholder="Describe qué pasó, desde qué dispositivo y, si aplica, el nombre de la clase o del alumno." aria-invalid={!!errores.descripcion} />
          <div className="flex justify-between mt-1">
            {errores.descripcion ? <p className="text-xs font-semibold text-red-600">{errores.descripcion}</p> : <span />}
            <span className="text-xs font-semibold text-slate-400">{form.descripcion.length}/1000</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function TarjetaSolicitud({ s, onCerrar }) {
  const estado = describirEstado(s.estado);
  const sla = describirSla(s.estadoSla);
  const prioridad = describirPrioridad(s.prioridad);
  return (
    <Tarjeta className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-slate-400 tracking-wider">{s.codigo} · {s.tipoNombre}</p>
          <h3 className="text-base font-black text-slate-900 mt-0.5">{s.asunto}</h3>
          <p className="text-sm text-slate-600 font-medium mt-1 whitespace-pre-line">{s.descripcion}</p>
        </div>
        <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 shrink-0">
          <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
          <Insignia tono={prioridad.tono}>Prioridad {prioridad.etiqueta.toLowerCase()}</Insignia>
        </div>
      </div>
      {s.respuesta && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700 flex items-center gap-1.5">
            <MessageSquareText className="w-4 h-4" aria-hidden="true" /> Respuesta de la academia
          </p>
          <p className="text-sm font-medium text-slate-700 mt-1 whitespace-pre-line">{s.respuesta}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" aria-hidden="true" />
          Registrada {tiempoRelativo(s.creadoEn)} · {esPendiente(s.estado)
            ? <>{tiempoRestante(s.venceEn)} <Insignia tono={sla.tono} className="ml-1">{sla.etiqueta}</Insignia></>
            : <>atendida el {formatearFechaHora(s.resueltoEn)}</>}
        </span>
        {s.estado === 'RESUELTA' && (
          <button type="button" onClick={() => onCerrar(s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Confirmar que quedó resuelto
          </button>
        )}
      </div>
    </Tarjeta>
  );
}

/** Mesa de ayuda del alumno y del apoderado: catálogo de servicios, registro y seguimiento de solicitudes. */
export default function MesaAyuda() {
  const toast = useToast();
  const catalogo = useDatos('/api/mesa-ayuda/catalogo');
  const solicitudes = useDatos('/api/mesa-ayuda/solicitudes');
  const [formulario, setFormulario] = useState(null);
  const [porCerrar, setPorCerrar] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  const lista = Array.isArray(solicitudes.datos) ? solicitudes.datos : [];
  const tipos = Array.isArray(catalogo.datos) ? catalogo.datos : [];
  const pendientes = lista.filter((s) => esPendiente(s.estado));
  const historial = lista.filter((s) => !esPendiente(s.estado));

  const cerrar = async () => {
    setCerrando(true);
    try {
      await api(`/api/mesa-ayuda/solicitudes/${porCerrar.id}/cerrar`, { method: 'PATCH' });
      toast.exito(`Gracias por confirmar. La solicitud ${porCerrar.codigo} quedó cerrada.`);
      setPorCerrar(null);
      await solicitudes.recargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCerrando(false);
    }
  };

  return (
    <div className="space-y-8">
      <Alerta tipo="error">{solicitudes.error || catalogo.error}</Alerta>

      <section aria-labelledby="titulo-catalogo">
        <TituloSeccion id="titulo-catalogo" icono={LifeBuoy}
          accion={<button type="button" onClick={() => setFormulario({ tipo: '' })} className={`${BOTON_PRIMARIO} shrink-0 whitespace-nowrap`}><Plus className="w-4 h-4" aria-hidden="true" /> Nueva solicitud</button>}>
          ¿En qué te ayudamos?
        </TituloSeccion>
        {catalogo.datos === null ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"><Esqueleto className="h-28" /><Esqueleto className="h-28" /><Esqueleto className="h-28" /></div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tipos.map((c) => {
              const prioridad = describirPrioridad(c.prioridad);
              return (
                <button key={c.tipo} type="button" onClick={() => setFormulario({ tipo: c.tipo })}
                  className="text-left p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                  <p className="font-black text-slate-900">{c.nombre}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{c.descripcion}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Insignia tono="indigo"><Clock className="w-3 h-3" aria-hidden="true" /> Máx. {textoSla(c.horasSla)}</Insignia>
                    <Insignia tono={prioridad.tono}>Prioridad {prioridad.etiqueta.toLowerCase()}</Insignia>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-pendientes">
        <TituloSeccion id="titulo-pendientes" icono={Inbox}>Mis solicitudes en curso ({pendientes.length})</TituloSeccion>
        {solicitudes.datos === null && <Esqueleto className="h-32" />}
        {solicitudes.datos !== null && pendientes.length === 0 && (
          <EstadoVacio icono={Inbox} titulo="No tienes solicitudes pendientes" texto="Cuando registres una, verás aquí su estado y el tiempo que falta para que la atendamos." />
        )}
        <div className="space-y-4">{pendientes.map((s) => <TarjetaSolicitud key={s.id} s={s} onCerrar={setPorCerrar} />)}</div>
      </section>

      {historial.length > 0 && (
        <section aria-labelledby="titulo-historial">
          <TituloSeccion id="titulo-historial" icono={CheckCircle2}>Historial ({historial.length})</TituloSeccion>
          <div className="space-y-4">{historial.map((s) => <TarjetaSolicitud key={s.id} s={s} onCerrar={setPorCerrar} />)}</div>
        </section>
      )}

      {formulario && (
        <FormularioSolicitud abierto catalogo={tipos} tipoInicial={formulario.tipo} onCerrar={() => setFormulario(null)}
          onCreada={async () => { setFormulario(null); await solicitudes.recargar(); }} />
      )}
      <Confirmar abierto={!!porCerrar} titulo="¿Quedó resuelto?" textoConfirmar="Sí, cerrar solicitud" cargando={cerrando}
        mensaje={porCerrar ? `Al confirmar, la solicitud ${porCerrar.codigo} pasa a CERRADA. Si vuelves a tener el problema, registra una nueva.` : ''}
        onConfirmar={cerrar} onCancelar={() => setPorCerrar(null)} />
    </div>
  );
}
