import { createContext, useContext } from 'react';
import { hoyISO } from '../../utils/format';

export const AdminContext = createContext(null);

/** Datos y acciones compartidos por todas las pestañas del panel de administración. */
export function useAdmin() {
  return useContext(AdminContext);
}

/** Una matrícula ACTIVA cuya fecha de fin ya pasó cuenta como VENCIDA aunque la tarea diaria aún no la actualice. */
export function estadoEfectivo(m, hoy = hoyISO()) {
  if (m.estado === 'ACTIVA' && m.fechaFin && m.fechaFin < hoy) return 'VENCIDA';
  return m.estado;
}
