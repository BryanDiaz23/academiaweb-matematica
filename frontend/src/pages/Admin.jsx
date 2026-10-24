import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, BookOpen, ClipboardList, GraduationCap, Heart, KeyRound, LayoutDashboard, LifeBuoy, Loader2, RefreshCw, Users } from 'lucide-react';
import { useDatos } from '../hooks/useDatos';
import { AdminContext, estadoEfectivo } from './admin/contexto';
import CambiarPassword from '../components/CambiarPassword';
import PanelShell from '../components/PanelShell';
import { ToastProvider } from '../components/ui/Toast';
import { BOTON_SECUNDARIO } from '../components/ui/ui';
import Dashboard from './admin/Dashboard';
import Matriculas from './admin/Matriculas';
import Clases from './admin/Clases';
import Usuarios from './admin/Usuarios';
import Familias from './admin/Familias';
import Solicitudes from './admin/Solicitudes';
import MesaAyuda from './admin/MesaAyuda';
import Auditoria from './admin/Auditoria';

const PESTANAS = ['resumen', 'matriculas', 'clases', 'usuarios', 'familias', 'solicitudes', 'mesa', 'auditoria', 'cuenta'];

const TITULOS = {
  resumen: ['Panel de administración', 'Visión general de la academia: ingresos, matrículas y lo que necesita tu atención.'],
  matriculas: ['Matrículas', 'Valida pagos, renueva vigencias y matricula alumnos manualmente.'],
  clases: ['Clases grabadas', 'Publica, oculta y organiza las sesiones que ven los alumnos.'],
  usuarios: ['Usuarios', 'Cuentas, accesos y soporte a alumnos.'],
  familias: ['Familias', 'Vincula a cada padre o apoderado con su hijo para que vea su avance.'],
  solicitudes: ['Solicitudes de información', 'Interesados que pidieron su clase de diagnóstico.'],
  mesa: ['Mesa de ayuda', 'Solicitudes de servicio de alumnos y apoderados, atendidas dentro de su SLA.'],
  auditoria: ['Auditoría de seguridad', 'Inicios de sesión, bloqueos y cambios sensibles.'],
  cuenta: ['Mi cuenta', 'Seguridad de tu acceso de administrador.'],
};

function AdminPanel() {
  const [params, setParams] = useSearchParams();
  const pestana = PESTANAS.includes(params.get('seccion')) ? params.get('seccion') : 'resumen';
  const preset = params.get('filtro') || '';
  const [actualizando, setActualizando] = useState(false);

  const resumen = useDatos('/api/admin/resumen');
  const matriculas = useDatos('/api/admin/matriculas');
  const usuarios = useDatos('/api/admin/usuarios');
  const vinculos = useDatos('/api/admin/vinculos');
  const clases = useDatos('/api/admin/clases');
  const solicitudes = useDatos('/api/admin/solicitudes');
  const auditoria = useDatos('/api/admin/auditoria');
  const mesaAyuda = useDatos('/api/admin/mesa-ayuda');
  const niveles = useDatos('/api/public/niveles', { auth: false });
  const horarios = useDatos('/api/public/horarios', { auth: false });

  const irA = useCallback((id, filtro = '') => {
    const siguiente = {};
    if (id !== 'resumen') siguiente.seccion = id;
    if (filtro) siguiente.filtro = filtro;
    setParams(siguiente);
    window.scrollTo({ top: 0 });
  }, [setParams]);

  const recargarTodo = useCallback(async () => {
    setActualizando(true);
    await Promise.all([resumen, matriculas, usuarios, vinculos, clases, solicitudes, auditoria, mesaAyuda].map((r) => r.recargar()));
    setActualizando(false);
  }, [resumen, matriculas, usuarios, vinculos, clases, solicitudes, auditoria, mesaAyuda]);

  const contexto = useMemo(() => ({
    irA,
    resumen, matriculas, usuarios, vinculos, clases, solicitudes, auditoria, mesaAyuda, niveles, horarios,
    recargarTodo,
  }), [irA, resumen, matriculas, usuarios, vinculos, clases, solicitudes, auditoria, mesaAyuda, niveles, horarios, recargarTodo]);

  // Indicadores de la barra lateral
  const pendientes = (matriculas.datos || []).filter((m) => estadoEfectivo(m) === 'PENDIENTE').length;
  const sinAtender = (solicitudes.datos || []).filter((s) => !s.atendida).length;
  const ticketsPendientes = (Array.isArray(mesaAyuda.datos) ? mesaAyuda.datos : []).filter((s) => s.estado === 'ABIERTA' || s.estado === 'EN_PROCESO').length;
  const conVinculo = new Set((vinculos.datos || []).map((v) => v.apoderadoId));
  const apoderadosSinHijo = (usuarios.datos || []).filter((u) => u.rol === 'APODERADO' && u.activo && !conVinculo.has(u.id)).length;
  const items = [
    { id: 'resumen', texto: 'Resumen', Icono: LayoutDashboard },
    { id: 'matriculas', texto: 'Matrículas', Icono: GraduationCap, cuenta: pendientes, alerta: true },
    { id: 'clases', texto: 'Clases grabadas', Icono: BookOpen },
    { id: 'usuarios', texto: 'Usuarios', Icono: Users },
    { id: 'familias', texto: 'Familias', Icono: Heart, cuenta: apoderadosSinHijo, alerta: true },
    { id: 'solicitudes', texto: 'Solicitudes', Icono: ClipboardList, cuenta: sinAtender, alerta: true },
    { id: 'mesa', texto: 'Mesa de ayuda', Icono: LifeBuoy, cuenta: ticketsPendientes, alerta: true },
    { id: 'auditoria', texto: 'Auditoría', Icono: Activity },
    { id: 'cuenta', texto: 'Mi cuenta', Icono: KeyRound },
  ];

  const claveVista = `${pestana}:${preset}`;
  const contenido = {
    resumen: <Dashboard />,
    matriculas: <Matriculas key={claveVista} filtroInicial={preset} />,
    clases: <Clases key={claveVista} filtroInicial={preset} />,
    usuarios: <Usuarios key={claveVista} filtroInicial={preset} />,
    familias: <Familias key={claveVista} />,
    solicitudes: <Solicitudes key={claveVista} filtroInicial={preset} />,
    mesa: <MesaAyuda key={claveVista} filtroInicial={preset} />,
    auditoria: <Auditoria key={claveVista} filtroInicial={preset} />,
    cuenta: <CambiarPassword />,
  }[pestana];

  return (
    <AdminContext.Provider value={contexto}>
      <PanelShell titulo={TITULOS[pestana][0]} subtitulo={TITULOS[pestana][1]} items={items} activo={pestana} onCambiar={(id) => irA(id)} rolEtiqueta="Administrador"
        acciones={pestana !== 'cuenta' && (
          <button type="button" onClick={recargarTodo} disabled={actualizando} className={BOTON_SECUNDARIO}>
            {actualizando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />} Actualizar datos
          </button>
        )}>
        {contenido}
      </PanelShell>
    </AdminContext.Provider>
  );
}

export default function Admin() {
  return (
    <ToastProvider>
      <AdminPanel />
    </ToastProvider>
  );
}
