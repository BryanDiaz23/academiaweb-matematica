import { API_URL } from '../config';
import { borrarSesion, leerSesion } from './session';

export const EVENTO_SESION_EXPIRADA = 'mse:sesion-expirada';

export class ApiError extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

/**
 * Cliente HTTP único para la API. Adjunta el JWT en "Authorization: Bearer",
 * traduce los errores del servidor y cierra la sesión si el token deja de ser válido (401).
 */
export async function api(ruta, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? leerSesion()?.token : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Si es la primera visita del día, espera unos segundos y vuelve a intentarlo.');
  }

  if (respuesta.status === 204) return null;

  let datos = null;
  const texto = await respuesta.text();
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      borrarSesion();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    throw new ApiError(respuesta.status, datos?.mensaje || `Error ${respuesta.status}`, datos?.detalles || []);
  }
  return datos;
}
