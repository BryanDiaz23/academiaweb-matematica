import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, EVENTO_SESION_EXPIRADA } from '../api/client';
import { borrarSesion, guardarSesion, leerSesion } from '../api/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leerSesion());

  const logout = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  const login = useCallback(async (usuario, password) => {
    const datos = await api('/api/auth/login', {
      method: 'POST',
      body: { usuario, password },
      auth: false,
    });
    const nueva = {
      token: datos.token,
      expiraEn: Date.now() + datos.expiraEnSegundos * 1000,
      usuario: datos.usuario,
    };
    guardarSesion(nueva);
    setSesion(nueva);
    return datos.usuario;
  }, []);

  // Actualiza los datos del usuario en la sesión (p. ej. tras cambiar una contraseña temporal).
  const actualizarUsuario = useCallback((cambios) => {
    setSesion((actual) => {
      if (!actual) return actual;
      const nueva = { ...actual, usuario: { ...actual.usuario, ...cambios } };
      guardarSesion(nueva);
      return nueva;
    });
  }, []);

  // Si la API responde 401 (token vencido o revocado) se cierra la sesión en toda la app.
  useEffect(() => {
    const alExpirar = () => setSesion(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // Cierre automático cuando vence el token.
  useEffect(() => {
    if (!sesion) return undefined;
    const restante = sesion.expiraEn - Date.now();
    const id = setTimeout(logout, Math.max(0, restante));
    return () => clearTimeout(id);
  }, [sesion, logout]);

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      autenticado: Boolean(sesion),
      esAdmin: sesion?.usuario?.rol === 'ADMIN',
      esApoderado: sesion?.usuario?.rol === 'APODERADO',
      login,
      logout,
      actualizarUsuario,
    }),
    [sesion, login, logout, actualizarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function rutaInicioPorRol(usuario) {
  if (usuario?.debeCambiarPassword) return '/cambiar-password';
  if (usuario?.rol === 'ADMIN') return '/admin';
  if (usuario?.rol === 'APODERADO') return '/familia';
  return '/aula';
}
