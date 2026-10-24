// La sesión (JWT) se guarda en sessionStorage: se borra al cerrar la pestaña
// y no se comparte entre pestañas, reduciendo la ventana de exposición del token.
const CLAVE = 'mse.sesion';

export function leerSesion() {
  try {
    const raw = sessionStorage.getItem(CLAVE);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion?.token || !sesion?.expiraEn || Date.now() >= sesion.expiraEn) {
      sessionStorage.removeItem(CLAVE);
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    /* almacenamiento no disponible: la sesión vive solo en memoria */
  }
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin acción */
  }
}
