import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LifeBuoy, MessageCircle, UserCircle, Users } from 'lucide-react';
import { useDatos } from '../hooks/useDatos';
import { useAuth } from '../context/AuthContext';
import { enlaceWhatsAppTexto } from '../config';
import { saludo } from '../utils/format';
import { describirEstado, etiquetaParentesco, lineaProgreso, mensajeWhatsApp, necesitaAtencion, textoActividad, textoVigencia } from '../utils/avance';
import Alerta from '../components/Alerta';
import InformeAvance from '../components/avance/InformeAvance';
import PanelShell from '../components/PanelShell';
import { ToastProvider } from '../components/ui/Toast';
import { Anillo, Avatar, BOTON_PRIMARIO, BOTON_SECUNDARIO, EstadoVacio, Esqueleto, Insignia, Tarjeta, TONO_NIVEL } from '../components/ui/ui';
import CuentaFamilia from './familia/Cuenta';
import MesaAyuda from '../components/mesa/MesaAyuda';

const SECCIONES = ['hijos', 'ayuda', 'cuenta'];

function TarjetaHijo({ hijo, onVer }) {
  const estado = describirEstado(hijo.estado);
  const atencion = necesitaAtencion(hijo);
  return (
    <Tarjeta className={`p-5 sm:p-6 ${atencion ? 'border-amber-300' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Avatar nombre={hijo.nombre} tamano="lg" tono="violeta" />
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 leading-tight">{hijo.nombre}</h2>
            <p className="text-sm font-semibold text-slate-500">@{hijo.username} · {etiquetaParentesco(hijo.parentesco)}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
              {hijo.niveles.map((n) => <Insignia key={n.codigo} tono={TONO_NIVEL[n.codigo] || 'gris'}>{n.nombre}</Insignia>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Anillo valor={hijo.porcentaje} tamano={88} grosor={9} etiqueta={`Avance de ${hijo.nombre}`} />
          <dl className="text-sm space-y-1">
            <div><dt className="sr-only">Clases</dt><dd className="font-bold text-slate-800">{lineaProgreso(hijo.clasesVistas, hijo.totalClases, 0)}</dd></div>
            <div><dt className="sr-only">Última actividad</dt><dd className="font-semibold text-slate-500">Última actividad: {textoActividad(hijo.diasSinActividad).toLowerCase()}</dd></div>
            <div><dt className="sr-only">Vigencia</dt><dd className="font-semibold text-slate-500">{textoVigencia(hijo.diasParaVencer)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => onVer(hijo.alumnoId)} className={BOTON_PRIMARIO}>
          Ver informe completo <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <a href={enlaceWhatsAppTexto(mensajeWhatsApp('contacto', hijo))} target="_blank" rel="noopener noreferrer" className={BOTON_SECUNDARIO}>
          <MessageCircle className="w-4 h-4" aria-hidden="true" /> Hablar con la academia
        </a>
      </div>
    </Tarjeta>
  );
}

function ListaHijos({ hijos, usuario, onVer, onAyuda }) {
  if (hijos.datos === null) {
    return <div className="space-y-4"><Esqueleto className="h-44" /><Esqueleto className="h-44" /></div>;
  }
  const lista = Array.isArray(hijos.datos) ? hijos.datos : [];
  if (lista.length === 0) {
    return (
      <div className="space-y-4">
        <Alerta tipo="error">{hijos.error}</Alerta>
        <EstadoVacio icono={Users} titulo="Todavía no tienes hijos vinculados"
          texto="Por seguridad, la academia verifica tu relación con el alumno antes de mostrarte su avance. Escríbenos con tu usuario y el nombre de tu hijo o hija y lo vinculamos.">
          <a href={enlaceWhatsAppTexto(mensajeWhatsApp('vincular', { username: usuario?.username }))} target="_blank" rel="noopener noreferrer" className={BOTON_PRIMARIO}>
            <MessageCircle className="w-4 h-4" aria-hidden="true" /> Pedir la vinculación por WhatsApp
          </a>
          <button type="button" onClick={onAyuda} className={`${BOTON_SECUNDARIO} ml-3`}>
            <LifeBuoy className="w-4 h-4" aria-hidden="true" /> O desde la mesa de ayuda
          </button>
        </EstadoVacio>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {lista.map((h) => <TarjetaHijo key={h.alumnoId} hijo={h} onVer={onVer} />)}
    </div>
  );
}

function DetalleHijo({ alumnoId, onVolver }) {
  const { datos, error } = useDatos(`/api/apoderado/hijos/${alumnoId}/avance`);
  return (
    <div className="space-y-6">
      <button type="button" onClick={onVolver} className={`${BOTON_SECUNDARIO} no-imprimir`}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver a mis hijos
      </button>
      {datos === null && <div className="space-y-4"><Esqueleto className="h-40" /><Esqueleto className="h-28" /><Esqueleto className="h-56" /></div>}
      {Array.isArray(datos) && <Alerta tipo="error">{error || 'No se pudo cargar el informe.'}</Alerta>}
      {datos && !Array.isArray(datos) && <InformeAvance avance={datos} modo="familia" />}
    </div>
  );
}

function FamiliaPanel() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const seccion = SECCIONES.includes(params.get('seccion')) ? params.get('seccion') : 'hijos';
  const hijoId = seccion === 'hijos' && /^\d+$/.test(params.get('hijo') || '') ? Number(params.get('hijo')) : null;
  const hijos = useDatos('/api/apoderado/hijos');

  const irA = useCallback((id) => {
    setParams(id === 'hijos' ? {} : { seccion: id });
    window.scrollTo({ top: 0 });
  }, [setParams]);
  const verHijo = useCallback((id) => {
    setParams({ hijo: String(id) });
    window.scrollTo({ top: 0 });
  }, [setParams]);

  const lista = useMemo(() => (Array.isArray(hijos.datos) ? hijos.datos : []), [hijos.datos]);
  const conAtencion = lista.filter(necesitaAtencion).length;
  const items = [
    { id: 'hijos', texto: 'Mis hijos', Icono: Users, cuenta: conAtencion, alerta: true },
    { id: 'ayuda', texto: 'Mesa de ayuda', Icono: LifeBuoy },
    { id: 'cuenta', texto: 'Mi cuenta', Icono: UserCircle },
  ];

  const nombre = usuario?.nombreCompleto?.split(' ')[0] || 'familia';
  const hijoActual = lista.find((h) => h.alumnoId === hijoId);
  let titulo = `${saludo()}, ${nombre}`;
  let subtitulo = 'Aquí ves cómo avanza cada uno de tus hijos en la academia.';
  if (hijoId) {
    titulo = hijoActual ? `Avance de ${hijoActual.nombre.split(' ')[0]}` : 'Informe de avance';
    subtitulo = 'Clases vistas, actividad reciente y vigencia de la matrícula.';
  }
  if (seccion === 'ayuda') {
    titulo = 'Mesa de ayuda';
    subtitulo = 'Pide la vinculación de tu hijo, información o soporte, y sigue cada solicitud.';
  }
  if (seccion === 'cuenta') {
    titulo = 'Mi cuenta';
    subtitulo = 'Tus datos y la seguridad de tu acceso.';
  }

  return (
    <PanelShell titulo={titulo} subtitulo={subtitulo} items={items} activo={seccion} onCambiar={irA} rolEtiqueta="Apoderado" ayuda>
      {seccion === 'cuenta' && <CuentaFamilia />}
      {seccion === 'ayuda' && <MesaAyuda />}
      {seccion === 'hijos' && !hijoId && <ListaHijos hijos={hijos} usuario={usuario} onVer={verHijo} onAyuda={() => irA('ayuda')} />}
      {seccion === 'hijos' && hijoId && <DetalleHijo key={hijoId} alumnoId={hijoId} onVolver={() => irA('hijos')} />}
    </PanelShell>
  );
}

export default function Familia() {
  return (
    <ToastProvider>
      <FamiliaPanel />
    </ToastProvider>
  );
}
