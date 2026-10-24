import React, { useMemo, useState } from 'react';
import { Copy, Download, KeyRound, Lock, RotateCcw, TrendingUp, Unlock, UserCheck, UserX } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { descargarCSV } from '../../utils/descarga';
import { formatearFecha, formatearFechaHora, hoyISO, normalizar, tiempoRelativo } from '../../utils/format';
import Alerta from '../../components/Alerta';
import ModalAvance from '../../components/avance/ModalAvance';
import { Confirmar, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  Avatar, BOTON_PRIMARIO, BOTON_SECUNDARIO, CampoBusqueda, Chips, Insignia, TONO_ESTADO_MATRICULA,
} from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { estadoEfectivo, useAdmin } from './contexto';

const FILTROS = ['TODOS', 'ALUMNOS', 'APODERADOS', 'ADMINS', 'DESACTIVADOS', 'BLOQUEADOS', 'TEMPORAL'];

const TONO_ROL = { ADMIN: 'indigo', APODERADO: 'azul', ALUMNO: 'violeta' };

function EstadoCuenta({ u }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Insignia tono={u.activo ? 'verde' : 'rojo'}>{u.activo ? 'Activo' : 'Desactivado'}</Insignia>
      {u.bloqueado && <Insignia tono="naranja"><Lock className="w-3 h-3" aria-hidden="true" /> Bloqueado</Insignia>}
      {u.debeCambiarPassword && <Insignia tono="ambar">Clave temporal</Insignia>}
    </div>
  );
}

function Ficha({ usuario, yo, onCerrar, onAccion, procesando }) {
  const { matriculas, auditoria } = useAdmin();
  const hoy = hoyISO();
  const susMatriculas = (matriculas.datos || []).filter((m) => m.usuarioId === usuario.id);
  const susEventos = (auditoria.datos || []).filter((e) => e.usuario === usuario.username).slice(0, 6);
  const esYo = usuario.id === yo?.id;
  return (
    <Modal abierto onCerrar={onCerrar} titulo="Ficha del usuario" ancho="md"
      pie={<button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cerrar</button>}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar nombre={usuario.nombreCompleto} tamano="lg" />
          <div className="min-w-0">
            <p className="text-lg font-black text-slate-900 leading-tight">{usuario.nombreCompleto}</p>
            <p className="text-sm font-semibold text-slate-500">@{usuario.username} · {usuario.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Insignia tono={TONO_ROL[usuario.rol] || 'gris'}>{usuario.rol}</Insignia>
              <EstadoCuenta u={usuario} />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Registrado</dt><dd className="font-bold text-slate-800">{usuario.creadoEn ? formatearFecha(usuario.creadoEn.slice(0, 10)) : '—'}</dd></div>
          <div><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Último acceso</dt><dd className="font-bold text-slate-800">{formatearFechaHora(usuario.ultimoAcceso)}</dd></div>
        </dl>

        <section>
          <h3 className="text-sm font-black text-slate-900 mb-2">Matrículas ({susMatriculas.length})</h3>
          {susMatriculas.length === 0 ? <p className="text-sm text-slate-500 font-medium">Sin matrículas.</p> : (
            <ul className="space-y-2">
              {susMatriculas.map((m) => {
                const est = estadoEfectivo(m, hoy);
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.nivel}</p>
                      <p className="text-xs font-semibold text-slate-500">{m.fechaInicio ? `${formatearFecha(m.fechaInicio)} – ${formatearFecha(m.fechaFin)}` : 'Sin fechas'}</p>
                    </div>
                    <Insignia tono={TONO_ESTADO_MATRICULA[est] || 'gris'}>{est}</Insignia>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-black text-slate-900 mb-2">Actividad reciente</h3>
          {susEventos.length === 0 ? <p className="text-sm text-slate-500 font-medium">Sin eventos en la bitácora reciente.</p> : (
            <ul className="space-y-1.5">
              {susEventos.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{e.evento.replaceAll('_', ' ').toLowerCase()}</span>
                  <span className="text-xs font-semibold text-slate-400">{tiempoRelativo(e.creadoEn)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!esYo && (
          <section>
            <h3 className="text-sm font-black text-slate-900 mb-2">Acciones</h3>
            <div className="flex flex-wrap gap-2">
              <BotonFila tono={usuario.activo ? 'rojo' : 'verde'} icono={usuario.activo ? UserX : UserCheck} disabled={procesando} onClick={() => onAccion('estado', usuario)}>
                {usuario.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
              </BotonFila>
              {usuario.bloqueado && <BotonFila tono="naranja" icono={Unlock} disabled={procesando} onClick={() => onAccion('desbloquear', usuario)}>Desbloquear</BotonFila>}
              <BotonFila tono="indigo" icono={RotateCcw} disabled={procesando} onClick={() => onAccion('restablecer', usuario)}>Restablecer contraseña</BotonFila>
            </div>
          </section>
        )}
        {esYo && <p className="text-xs font-semibold text-slate-400">Esta es tu cuenta: cambia tu contraseña desde "Mi cuenta".</p>}
      </div>
    </Modal>
  );
}

export default function Usuarios({ filtroInicial }) {
  const { usuario: yo } = useAuth();
  const { usuarios } = useAdmin();
  const toast = useToast();
  const [filtro, setFiltro] = useState(FILTROS.includes(filtroInicial) ? filtroInicial : 'TODOS');
  const [buscar, setBuscar] = useState('');
  const [ficha, setFicha] = useState(null);
  const [avanceDe, setAvanceDe] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [temporal, setTemporal] = useState(null);
  const [copiado, setCopiado] = useState('');

  const lista = usuarios.datos || [];
  const cuentas = useMemo(() => ({
    TODOS: lista.length,
    ALUMNOS: lista.filter((u) => u.rol === 'ALUMNO').length,
    APODERADOS: lista.filter((u) => u.rol === 'APODERADO').length,
    ADMINS: lista.filter((u) => u.rol === 'ADMIN').length,
    DESACTIVADOS: lista.filter((u) => !u.activo).length,
    BLOQUEADOS: lista.filter((u) => u.bloqueado).length,
    TEMPORAL: lista.filter((u) => u.debeCambiarPassword).length,
  }), [lista]);

  const filtrados = useMemo(() => {
    const q = normalizar(buscar);
    return lista.filter((u) => {
      if (filtro === 'ALUMNOS' && u.rol !== 'ALUMNO') return false;
      if (filtro === 'APODERADOS' && u.rol !== 'APODERADO') return false;
      if (filtro === 'ADMINS' && u.rol !== 'ADMIN') return false;
      if (filtro === 'DESACTIVADOS' && u.activo) return false;
      if (filtro === 'BLOQUEADOS' && !u.bloqueado) return false;
      if (filtro === 'TEMPORAL' && !u.debeCambiarPassword) return false;
      return !q || normalizar(`${u.nombreCompleto} ${u.username} ${u.email}`).includes(q);
    });
  }, [lista, filtro, buscar]);

  const tabla = useTabla(filtrados, {
    clave: `${filtro}|${buscar}`,
    ordenInicial: { col: 'creado', dir: 'desc' },
    accesores: { nombre: (u) => u.nombreCompleto, rol: (u) => u.rol, acceso: (u) => u.ultimoAcceso || '', creado: (u) => u.creadoEn || '' },
  });

  // Mantiene la ficha abierta sincronizada con los datos recargados
  const fichaActual = ficha ? lista.find((u) => u.id === ficha.id) || ficha : null;

  const ejecutar = async (ruta, body, exito) => {
    setProcesando(true);
    try {
      await api(ruta, { method: 'PATCH', body });
      await usuarios.recargar();
      toast.exito(exito);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
      setConfirmacion(null);
    }
  };

  const alAccion = (tipo, u) => {
    if (tipo === 'desbloquear') return ejecutar(`/api/admin/usuarios/${u.id}/desbloquear`, undefined, `Cuenta de @${u.username} desbloqueada.`);
    return setConfirmacion({ tipo, u });
  };

  const confirmar = async () => {
    const { tipo, u } = confirmacion;
    if (tipo === 'estado') {
      return ejecutar(`/api/admin/usuarios/${u.id}/estado`, { activo: !u.activo }, `Cuenta de @${u.username} ${u.activo ? 'desactivada' : 'activada'}.`);
    }
    setProcesando(true);
    try {
      const r = await api(`/api/admin/usuarios/${u.id}/restablecer-password`, { method: 'PATCH' });
      setTemporal({ ...r, nombre: u.nombreCompleto });
      setCopiado('');
      await usuarios.recargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
      setConfirmacion(null);
    }
    return undefined;
  };

  const copiar = async (texto, clave) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(clave);
    } catch {
      toast.error('No se pudo copiar automáticamente: selecciónalo y cópialo a mano.');
    }
  };

  const exportar = () => {
    descargarCSV(`usuarios-${hoyISO()}`, [
      { titulo: 'Nombre', valor: (u) => u.nombreCompleto },
      { titulo: 'Usuario', valor: (u) => u.username },
      { titulo: 'Correo', valor: (u) => u.email },
      { titulo: 'Rol', valor: (u) => u.rol },
      { titulo: 'Activo', valor: (u) => (u.activo ? 'Sí' : 'No') },
      { titulo: 'Bloqueado', valor: (u) => (u.bloqueado ? 'Sí' : 'No') },
      { titulo: 'Registrado', valor: (u) => u.creadoEn || '' },
      { titulo: 'Último acceso', valor: (u) => u.ultimoAcceso || '' },
    ], tabla.ordenadas);
    toast.info(`Se exportaron ${tabla.ordenadas.length} usuario(s).`);
  };

  const columnas = [
    {
      id: 'nombre', titulo: 'Usuario', ordenable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={u.nombreCompleto} tamano="sm" tono={TONO_ROL[u.rol] || 'gris'} />
          <div className="min-w-0">
            <p className="font-bold text-slate-900">{u.nombreCompleto}{u.id === yo?.id && <span className="ml-2 text-[11px] font-extrabold text-slate-400">(tú)</span>}</p>
            <p className="text-xs text-slate-500">@{u.username} · {u.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'rol', titulo: 'Rol', ordenable: true, render: (u) => <Insignia tono={TONO_ROL[u.rol] || 'gris'}>{u.rol}</Insignia> },
    { id: 'estado', titulo: 'Estado', render: (u) => <EstadoCuenta u={u} /> },
    { id: 'acceso', titulo: 'Último acceso', ordenable: true, render: (u) => <span title={formatearFechaHora(u.ultimoAcceso)} className="whitespace-nowrap">{u.ultimoAcceso ? tiempoRelativo(u.ultimoAcceso) : 'Nunca'}</span> },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (u) => (
        <div className="flex flex-wrap gap-1.5">
          <BotonFila tono="indigo" onClick={() => setFicha(u)}>Ver ficha</BotonFila>
          {u.rol === 'ALUMNO' && <BotonFila tono="verde" icono={TrendingUp} onClick={() => setAvanceDe(u)}>Avance</BotonFila>}
          {u.id !== yo?.id && u.bloqueado && <BotonFila tono="naranja" icono={Unlock} disabled={procesando} onClick={() => alAccion('desbloquear', u)}>Desbloquear</BotonFila>}
        </div>
      ),
    },
  ];

  const mensajeTemporal = temporal
    ? `Hola ${temporal.nombre.split(' ')[0]}, tu contraseña temporal para Matemática Sin Estrés es: ${temporal.passwordTemporal}\nTu usuario es: ${temporal.username}\nAl ingresar te pediremos crear una nueva contraseña.`
    : '';

  return (
    <div className="space-y-5">
      <Alerta tipo="error">{usuarios.error}</Alerta>

      <Chips etiqueta="Filtrar usuarios" valor={filtro} onCambiar={setFiltro} opciones={[
        { id: 'TODOS', texto: 'Todos', cuenta: cuentas.TODOS },
        { id: 'ALUMNOS', texto: 'Alumnos', cuenta: cuentas.ALUMNOS },
        { id: 'APODERADOS', texto: 'Apoderados', cuenta: cuentas.APODERADOS },
        { id: 'ADMINS', texto: 'Admins', cuenta: cuentas.ADMINS },
        { id: 'DESACTIVADOS', texto: 'Desactivados', cuenta: cuentas.DESACTIVADOS },
        { id: 'BLOQUEADOS', texto: 'Bloqueados', cuenta: cuentas.BLOQUEADOS },
        { id: 'TEMPORAL', texto: 'Clave temporal', cuenta: cuentas.TEMPORAL },
      ]} />

      <div className="flex flex-col sm:flex-row gap-3">
        <CampoBusqueda id="buscar-usuarios" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por nombre, usuario o correo…" className="flex-1 max-w-xl" />
        <button type="button" onClick={exportar} disabled={tabla.total === 0} className={`${BOTON_SECUNDARIO} sm:ml-auto`}><Download className="w-4 h-4" aria-hidden="true" /> Exportar CSV</button>
      </div>

      {usuarios.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
        <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Usuarios" vacio="No hay usuarios que coincidan con los filtros." />
      )}

      <ModalAvance alumno={avanceDe} onCerrar={() => setAvanceDe(null)} />
      {fichaActual && <Ficha usuario={fichaActual} yo={yo} procesando={procesando} onCerrar={() => setFicha(null)} onAccion={alAccion} />}

      <Confirmar abierto={Boolean(confirmacion)} peligro={confirmacion?.tipo === 'estado' && confirmacion?.u.activo} cargando={procesando}
        titulo={confirmacion?.tipo === 'estado' ? (confirmacion?.u.activo ? 'Desactivar cuenta' : 'Activar cuenta') : 'Restablecer contraseña'}
        mensaje={confirmacion?.tipo === 'estado'
          ? (confirmacion?.u.activo
            ? `${confirmacion?.u.nombreCompleto} no podrá iniciar sesión hasta que reactives su cuenta.`
            : `${confirmacion?.u.nombreCompleto} podrá volver a iniciar sesión.`)
          : `Se generará una contraseña temporal para ${confirmacion?.u.nombreCompleto}. Su contraseña actual dejará de funcionar y deberá cambiarla al ingresar.`}
        textoConfirmar={confirmacion?.tipo === 'estado' ? (confirmacion?.u.activo ? 'Sí, desactivar' : 'Sí, activar') : 'Generar contraseña'}
        onCancelar={() => setConfirmacion(null)} onConfirmar={confirmar} />

      <Modal abierto={Boolean(temporal)} onCerrar={() => setTemporal(null)} titulo="Contraseña temporal generada" ancho="sm"
        descripcion={temporal ? `Para ${temporal.nombre} (@${temporal.username})` : ''}
        pie={<button type="button" onClick={() => setTemporal(null)} className={BOTON_PRIMARIO}>Listo</button>}>
        {temporal && (
          <div className="space-y-4">
            <Alerta tipo="aviso">Cópiala ahora: no se volverá a mostrar. Entrégala por un canal privado.</Alerta>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <code className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-base font-bold text-slate-900 select-all break-all">{temporal.passwordTemporal}</code>
              <button type="button" onClick={() => copiar(temporal.passwordTemporal, 'clave')} className={BOTON_SECUNDARIO}>
                <KeyRound className="w-4 h-4" aria-hidden="true" /> {copiado === 'clave' ? '¡Copiada!' : 'Copiar'}
              </button>
            </div>
            <button type="button" onClick={() => copiar(mensajeTemporal, 'mensaje')} className={`${BOTON_SECUNDARIO} w-full`}>
              <Copy className="w-4 h-4" aria-hidden="true" /> {copiado === 'mensaje' ? '¡Mensaje copiado!' : 'Copiar mensaje listo para enviar'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
