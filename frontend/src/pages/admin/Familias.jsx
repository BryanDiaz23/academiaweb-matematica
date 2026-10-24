import React, { useMemo, useState } from 'react';
import { Heart, Trash2, TrendingUp, UserPlus } from 'lucide-react';
import { api } from '../../api/client';
import { etiquetaParentesco, OPCIONES_PARENTESCO } from '../../utils/avance';
import { formatearFecha, normalizar } from '../../utils/format';
import Alerta from '../../components/Alerta';
import ModalAvance from '../../components/avance/ModalAvance';
import { Confirmar } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { BOTON_PRIMARIO, CampoBusqueda, CLASE_ETIQUETA, CLASE_INPUT, Insignia, StatCard, Tarjeta, TituloSeccion } from '../../components/ui/ui';
import { BotonFila, TablaDatos, useTabla } from './comunes';
import { useAdmin } from './contexto';

const FORM_VACIO = { apoderadoId: '', alumnoId: '', parentesco: 'PADRE' };

export default function Familias() {
  const { usuarios, vinculos } = useAdmin();
  const toast = useToast();
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [quitar, setQuitar] = useState(null);
  const [avanceDe, setAvanceDe] = useState(null);

  const lista = useMemo(() => vinculos.datos || [], [vinculos.datos]);
  const todos = usuarios.datos || [];
  const apoderados = todos.filter((u) => u.rol === 'APODERADO' && u.activo);
  const alumnos = todos.filter((u) => u.rol === 'ALUMNO' && u.activo);
  const conVinculo = useMemo(() => new Set(lista.map((v) => v.apoderadoId)), [lista]);
  const sinVinculo = apoderados.filter((a) => !conVinculo.has(a.id));

  const filtrados = useMemo(() => {
    const q = normalizar(buscar);
    return lista.filter((v) => !q || normalizar(`${v.apoderado} ${v.apoderadoUsername} ${v.alumno} ${v.alumnoUsername}`).includes(q));
  }, [lista, buscar]);

  const tabla = useTabla(filtrados, {
    clave: buscar,
    ordenInicial: { col: 'creado', dir: 'desc' },
    accesores: { apoderado: (v) => v.apoderado, alumno: (v) => v.alumno, creado: (v) => v.creadoEn || '' },
  });

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const vincular = async (e) => {
    e.preventDefault();
    if (!form.apoderadoId || !form.alumnoId) {
      setError('Elige al apoderado y al alumno.');
      return;
    }
    setGuardando(true);
    try {
      await api('/api/admin/vinculos', {
        method: 'POST',
        body: { apoderadoId: Number(form.apoderadoId), alumnoId: Number(form.alumnoId), parentesco: form.parentesco },
      });
      await vinculos.recargar();
      toast.exito('Vínculo creado: el apoderado ya puede ver el avance de ese alumno.');
      setForm({ ...FORM_VACIO, parentesco: form.parentesco });
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const confirmarQuitar = async () => {
    setGuardando(true);
    try {
      await api(`/api/admin/vinculos/${quitar.id}`, { method: 'DELETE' });
      await vinculos.recargar();
      toast.exito('Vínculo eliminado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
      setQuitar(null);
    }
  };

  const columnas = [
    {
      id: 'apoderado', titulo: 'Apoderado', ordenable: true,
      render: (v) => (<><p className="font-bold text-slate-900">{v.apoderado}</p><p className="text-xs text-slate-500">@{v.apoderadoUsername}</p></>),
    },
    { id: 'parentesco', titulo: 'Relación', render: (v) => <Insignia tono="violeta">{etiquetaParentesco(v.parentesco)}</Insignia> },
    {
      id: 'alumno', titulo: 'Alumno', ordenable: true,
      render: (v) => (<><p className="font-bold text-slate-900">{v.alumno}</p><p className="text-xs text-slate-500">@{v.alumnoUsername}</p></>),
    },
    { id: 'creado', titulo: 'Desde', ordenable: true, render: (v) => <span className="whitespace-nowrap">{v.creadoEn ? formatearFecha(v.creadoEn.slice(0, 10)) : '—'}</span> },
    {
      id: 'acciones', titulo: 'Acciones',
      render: (v) => (
        <div className="flex flex-wrap gap-1.5">
          <BotonFila tono="indigo" icono={TrendingUp} onClick={() => setAvanceDe({ id: v.alumnoId, nombreCompleto: v.alumno, username: v.alumnoUsername })}>Ver avance</BotonFila>
          <BotonFila tono="rojo" icono={Trash2} onClick={() => setQuitar(v)}>Quitar</BotonFila>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Alerta tipo="error">{vinculos.error}</Alerta>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icono={Heart} etiqueta="Vínculos" valor={lista.length} nota="Padre ↔ alumno" tono="violeta" />
        <StatCard icono={UserPlus} etiqueta="Apoderados" valor={apoderados.length} nota="Cuentas activas registradas" tono="indigo" />
        <StatCard icono={UserPlus} etiqueta="Sin hijos vinculados" valor={sinVinculo.length} nota={sinVinculo.length > 0 ? 'Esperan que los vincules' : 'Todos tienen al menos un hijo'} tono={sinVinculo.length > 0 ? 'ambar' : 'verde'} />
      </div>

      <section aria-labelledby="titulo-vincular">
        <TituloSeccion id="titulo-vincular" icono={UserPlus}>Vincular un apoderado con un alumno</TituloSeccion>
        <Tarjeta className="p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-600 mb-4">
            Verifica por WhatsApp o por teléfono que la persona es realmente el padre, madre o tutor antes de vincular: desde ese momento podrá ver el avance del alumno.
            Los padres crean su cuenta en "Regístrate" eligiendo <strong>Soy padre, madre o apoderado</strong>.
          </p>
          <div className="mb-4"><Alerta tipo="error">{error}</Alerta></div>
          {apoderados.length === 0 ? (
            <Alerta tipo="info">Todavía no hay cuentas de apoderado activas. Cuando un padre se registre, aparecerá aquí.</Alerta>
          ) : (
            <form onSubmit={vincular} className="grid md:grid-cols-4 gap-4 items-end" noValidate>
              <div>
                <label htmlFor="vin-apoderado" className={CLASE_ETIQUETA}>Apoderado</label>
                <select id="vin-apoderado" name="apoderadoId" value={form.apoderadoId} onChange={cambiar} className={CLASE_INPUT}>
                  <option value="">Elige una cuenta…</option>
                  {apoderados.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto} (@{a.username}){conVinculo.has(a.id) ? '' : ' · sin hijos'}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="vin-alumno" className={CLASE_ETIQUETA}>Alumno</label>
                <select id="vin-alumno" name="alumnoId" value={form.alumnoId} onChange={cambiar} className={CLASE_INPUT}>
                  <option value="">Elige un alumno…</option>
                  {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto} (@{a.username})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="vin-parentesco" className={CLASE_ETIQUETA}>Relación</label>
                <select id="vin-parentesco" name="parentesco" value={form.parentesco} onChange={cambiar} className={CLASE_INPUT}>
                  {OPCIONES_PARENTESCO.map((o) => <option key={o.id} value={o.id}>{o.texto}</option>)}
                </select>
              </div>
              <button type="submit" disabled={guardando} className={BOTON_PRIMARIO}>
                <UserPlus className="w-4 h-4" aria-hidden="true" /> {guardando ? 'Vinculando…' : 'Vincular'}
              </button>
            </form>
          )}
        </Tarjeta>
      </section>

      <section aria-labelledby="titulo-vinculos">
        <TituloSeccion id="titulo-vinculos" icono={Heart}>Vínculos actuales</TituloSeccion>
        <div className="mb-4">
          <CampoBusqueda id="buscar-vinculos" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por apoderado o alumno…" className="max-w-xl" />
        </div>
        {vinculos.datos === null ? <p className="text-sm font-semibold text-slate-500">Cargando…</p> : (
          <TablaDatos columnas={columnas} tabla={tabla} etiqueta="Vínculos entre apoderados y alumnos" vacio="Aún no hay vínculos. Crea el primero con el formulario de arriba." />
        )}
      </section>

      <Confirmar abierto={Boolean(quitar)} peligro cargando={guardando} titulo="Quitar vínculo"
        mensaje={quitar ? `${quitar.apoderado} dejará de ver el avance de ${quitar.alumno}. Podrás volver a vincularlos cuando quieras.` : ''}
        textoConfirmar="Sí, quitar" onCancelar={() => setQuitar(null)} onConfirmar={confirmarQuitar} />
      <ModalAvance alumno={avanceDe} onCerrar={() => setAvanceDe(null)} />
    </div>
  );
}
