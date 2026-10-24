import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, GraduationCap, LayoutDashboard, LifeBuoy, PlayCircle, UserCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { diasHasta, hoyISO, saludo } from '../utils/format';
import PanelShell from '../components/PanelShell';
import { ToastProvider, useToast } from '../components/ui/Toast';
import { AulaContext, esNueva } from './aula/contexto';
import Inicio from './aula/Inicio';
import MisClases from './aula/MisClases';
import Matriculas from './aula/Matriculas';
import Horarios from './aula/Horarios';
import Cuenta from './aula/Cuenta';
import MesaAyuda from '../components/mesa/MesaAyuda';

const SECCIONES = ['inicio', 'clases', 'matriculas', 'horarios', 'ayuda', 'cuenta'];

function AulaPanel() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const seccion = SECCIONES.includes(params.get('seccion')) ? params.get('seccion') : 'inicio';

  const [matriculas, setMatriculas] = useState(null);
  const [clases, setClases] = useState(null);
  const [niveles, setNiveles] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [errorCarga, setErrorCarga] = useState('');

  const irA = useCallback((id) => {
    setParams(id === 'inicio' ? {} : { seccion: id }, { replace: false });
    window.scrollTo({ top: 0 });
  }, [setParams]);

  const cargarMatriculas = useCallback(async () => {
    try {
      setMatriculas(await api('/api/alumno/matriculas'));
    } catch (err) {
      setErrorCarga(err.message);
      setMatriculas([]);
    }
  }, []);

  const cargarClases = useCallback(async () => {
    try {
      setClases(await api('/api/alumno/clases'));
    } catch (err) {
      setErrorCarga(err.message);
      setClases([]);
    }
  }, []);

  useEffect(() => {
    cargarMatriculas();
    cargarClases();
    Promise.all([api('/api/public/niveles', { auth: false }), api('/api/public/horarios', { auth: false })])
      .then(([n, h]) => {
        setNiveles(n);
        setHorarios(h);
      })
      .catch(() => {});
  }, [cargarMatriculas, cargarClases]);

  // --------------------------------------------------------------- Datos derivados
  const derivados = useMemo(() => {
    const hoy = hoyISO();
    const lista = matriculas || [];
    const vigente = (m) => m.estado === 'ACTIVA' && (!m.fechaFin || m.fechaFin >= hoy);
    const activas = lista.filter(vigente);
    const pendientes = lista.filter((m) => m.estado === 'PENDIENTE');
    const vencidas = lista.filter((m) => m.estado === 'VENCIDA' || (m.estado === 'ACTIVA' && m.fechaFin && m.fechaFin < hoy));
    const porVencer = activas
      .filter((m) => m.fechaFin && diasHasta(m.fechaFin) <= 7)
      .sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));
    const diasRestantes = activas.filter((m) => m.fechaFin).length > 0
      ? Math.min(...activas.filter((m) => m.fechaFin).map((m) => diasHasta(m.fechaFin)))
      : null;
    const todas = clases || [];
    const vistas = todas.filter((c) => c.vista).length;
    return {
      activas,
      pendientes,
      vencidas,
      porVencer,
      diasRestantes,
      tieneActiva: activas.length > 0,
      totalClases: todas.length,
      clasesVistas: vistas,
      favoritas: todas.filter((c) => c.favorita).length,
      nuevas: todas.filter(esNueva).length,
      minutosVistos: todas.filter((c) => c.vista).reduce((s, c) => s + c.duracionMinutos, 0),
      progreso: todas.length > 0 ? Math.round((vistas / todas.length) * 100) : 0,
    };
  }, [matriculas, clases]);

  // --------------------------------------------------------------- Acciones sobre las clases
  const cambiarClase = useCallback((id, cambios) => {
    setClases((lista) => (lista || []).map((c) => (c.id === id ? { ...c, ...cambios } : c)));
  }, []);

  /** Marca/desmarca vista o favorita. Se refleja de inmediato y se revierte si el servidor falla. */
  const actualizarProgreso = useCallback(async (clase, cambios) => {
    const anterior = { vista: clase.vista, favorita: clase.favorita, ultimaVez: clase.ultimaVez };
    cambiarClase(clase.id, cambios);
    try {
      const r = await api(`/api/alumno/clases/${clase.id}/progreso`, { method: 'PUT', body: cambios });
      cambiarClase(clase.id, { vista: r.vista, favorita: r.favorita, ultimaVez: r.ultimaVez });
      if (cambios.vista === true) toast.exito('Clase marcada como vista. ¡Buen avance!');
      if (cambios.favorita === true) toast.exito('Guardada en tus favoritas.');
    } catch (err) {
      cambiarClase(clase.id, anterior);
      toast.error(err.message || 'No se pudo guardar el cambio.');
    }
  }, [cambiarClase, toast]);

  /** Registra que se abrió la clase para poder mostrar "Continuar viendo". */
  const registrarApertura = useCallback(async (clase) => {
    cambiarClase(clase.id, { ultimaVez: new Date().toISOString() });
    try {
      await api(`/api/alumno/clases/${clase.id}/abrir`, { method: 'POST' });
    } catch {
      /* no bloquea la visualización de la clase */
    }
  }, [cambiarClase]);

  const contexto = useMemo(() => ({
    usuario, matriculas, clases, niveles, horarios, derivados, irA,
    recargarMatriculas: cargarMatriculas, actualizarProgreso, registrarApertura,
  }), [usuario, matriculas, clases, niveles, horarios, derivados, irA, cargarMatriculas, actualizarProgreso, registrarApertura]);

  const items = [
    { id: 'inicio', texto: 'Inicio', Icono: LayoutDashboard },
    { id: 'clases', texto: 'Mis clases', Icono: PlayCircle, cuenta: derivados.nuevas, alerta: true },
    { id: 'matriculas', texto: 'Matrículas', Icono: GraduationCap, cuenta: derivados.pendientes.length },
    { id: 'horarios', texto: 'Horarios', Icono: CalendarDays },
    { id: 'ayuda', texto: 'Mesa de ayuda', Icono: LifeBuoy },
    { id: 'cuenta', texto: 'Mi cuenta', Icono: UserCircle },
  ];

  const nombre = usuario?.nombreCompleto?.split(' ')[0] || 'alumno';
  const titulos = {
    inicio: [`${saludo()}, ${nombre}`, 'Este es el resumen de tu avance en la academia.'],
    clases: ['Mis clases grabadas', 'Repasa a tu ritmo, marca lo que ya viste y guarda tus favoritas.'],
    matriculas: ['Mis matrículas', 'Revisa tu vigencia y solicita nuevos niveles.'],
    horarios: ['Horarios de clases en vivo', 'Consulta los turnos y agrégalos a tu calendario.'],
    ayuda: ['Mesa de ayuda', 'Pide información, acceso o soporte y sigue el estado de tu solicitud.'],
    cuenta: ['Mi cuenta', 'Tus datos y la seguridad de tu acceso.'],
  };

  return (
    <AulaContext.Provider value={contexto}>
      <PanelShell titulo={titulos[seccion][0]} subtitulo={titulos[seccion][1]} items={items} activo={seccion} onCambiar={irA} rolEtiqueta="Alumno" ayuda>
        {errorCarga && (
          <div role="alert" className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-800">{errorCarga}</div>
        )}
        {seccion === 'inicio' && <Inicio />}
        {seccion === 'clases' && <MisClases />}
        {seccion === 'matriculas' && <Matriculas />}
        {seccion === 'horarios' && <Horarios />}
        {seccion === 'ayuda' && <MesaAyuda />}
        {seccion === 'cuenta' && <Cuenta />}
      </PanelShell>
    </AulaContext.Provider>
  );
}

export default function Aula() {
  return (
    <ToastProvider>
      <AulaPanel />
    </ToastProvider>
  );
}
