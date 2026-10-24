import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

/** Carga una ruta de la API con estado de carga y error. `datos` es null mientras carga. */
export function useDatos(ruta, opciones) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const auth = opciones?.auth;
  const recargar = useCallback(async () => {
    try {
      setError('');
      setDatos(await api(ruta, auth === undefined ? undefined : { auth }));
    } catch (err) {
      setError(err.message);
      setDatos((previo) => previo ?? []);
    }
  }, [ruta, auth]);
  useEffect(() => {
    recargar();
  }, [recargar]);
  return { datos, error, recargar, setDatos };
}
