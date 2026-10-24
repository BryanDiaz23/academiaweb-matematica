import { createContext, useContext } from 'react';
import { diasHasta } from '../../utils/format';

export const AulaContext = createContext(null);

/** Datos y acciones compartidos por todas las secciones del Aula del alumno. */
export function useAula() {
  return useContext(AulaContext);
}

/** Una clase es "nueva" si se dio en los últimos 7 días y el alumno aún no la ve. */
export function esNueva(clase) {
  const d = diasHasta(clase.fechaClase);
  return d !== null && d <= 0 && d >= -7 && !clase.vista;
}
