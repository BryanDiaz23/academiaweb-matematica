import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { rutaInicioPorRol, useAuth } from '../context/AuthContext';

/**
 * Protege rutas del front-end. Es solo una ayuda de navegación: la autorización real
 * la aplica el back-end en cada endpoint (un usuario que fuerce la URL recibirá 401/403).
 */
export default function ProtectedRoute({ rol, children }) {
  const { autenticado, usuario } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (usuario.debeCambiarPassword && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }
  if (rol && usuario.rol !== rol) {
    return <Navigate to={rutaInicioPorRol(usuario)} replace />;
  }
  return children;
}
