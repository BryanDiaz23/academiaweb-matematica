import { useCallback, useState } from 'react';

/** Estado persistido en localStorage. Si el navegador lo bloquea, funciona igual en memoria. */
export function useLocalStorage(clave, inicial) {
  const [valor, setValor] = useState(() => {
    try {
      const guardado = window.localStorage.getItem(clave);
      return guardado === null ? inicial : JSON.parse(guardado);
    } catch {
      return inicial;
    }
  });

  const guardar = useCallback((nuevo) => {
    setValor(nuevo);
    try {
      window.localStorage.setItem(clave, JSON.stringify(nuevo));
    } catch {
      /* sin persistencia: se mantiene solo en memoria */
    }
  }, [clave]);

  return [valor, guardar];
}
