import React from 'react';
import { useDatos } from '../../hooks/useDatos';
import { Modal } from '../ui/Modal';
import { BOTON_SECUNDARIO, Esqueleto } from '../ui/ui';
import Alerta from '../Alerta';
import InformeAvance from './InformeAvance';

function Contenido({ alumnoId }) {
  const { datos, error } = useDatos(`/api/admin/alumnos/${alumnoId}/avance`);
  if (datos === null) return <Esqueleto className="h-64" />;
  if (Array.isArray(datos)) return <Alerta tipo="error">{error || 'No se pudo cargar el avance de este alumno.'}</Alerta>;
  return <InformeAvance avance={datos} modo="admin" />;
}

/** Ventana con el informe de avance de un alumno, para el administrador. */
export default function ModalAvance({ alumno, onCerrar }) {
  return (
    <Modal abierto={Boolean(alumno)} onCerrar={onCerrar} titulo="Avance del alumno" descripcion={alumno ? `${alumno.nombreCompleto} (@${alumno.username})` : ''} ancho="lg"
      pie={<button type="button" onClick={onCerrar} className={BOTON_SECUNDARIO}>Cerrar</button>}>
      {alumno && <Contenido alumnoId={alumno.id} />}
    </Modal>
  );
}
