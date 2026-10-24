import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { rutaInicioPorRol, useAuth } from '../context/AuthContext';
import CambiarPassword from '../components/CambiarPassword';
import Logo from '../components/Logo';

/** Pantalla obligatoria cuando el administrador restableció la contraseña del usuario. */
export default function CambiarPasswordObligatorio() {
  const { usuario, logout } = useAuth();

  // Al cambiar la contraseña la bandera se apaga y el usuario pasa a su panel.
  if (!usuario?.debeCambiarPassword) {
    return <Navigate to={rutaInicioPorRol(usuario)} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Logo size="lg" />
          <button type="button" onClick={logout} className="text-sm font-bold text-slate-500 hover:text-slate-800">Salir</button>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm font-semibold text-amber-900">
            Hola, {usuario?.nombreCompleto?.split(' ')[0]}. Ingresaste con una contraseña temporal entregada por la academia.
            Por tu seguridad, crea ahora una contraseña nueva para continuar.
          </p>
        </div>
        <CambiarPassword
          titulo="Crea tu nueva contraseña"
          descripcion="Este paso es obligatorio antes de usar la plataforma."
        />
      </div>
    </div>
  );
}
