import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, User } from 'lucide-react';
import { rutaInicioPorRol, useAuth } from '../context/AuthContext';
import Alerta from '../components/Alerta';
import CampoPassword from '../components/CampoPassword';
import Logo from '../components/Logo';

export default function Login() {
  const { login, autenticado, usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ usuario: location.state?.usuario || '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (autenticado) {
    return <Navigate to={rutaInicioPorRol(usuario)} replace />;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.usuario.trim() || !form.password) {
      setError('Completa tu usuario (o correo) y tu contraseña.');
      return;
    }
    setLoading(true);
    try {
      const u = await login(form.usuario.trim(), form.password);
      const destino = location.state?.from;
      const base = rutaInicioPorRol({ rol: u.rol });
      const permitido = !u.debeCambiarPassword && destino && destino.startsWith(base);
      navigate(permitido ? destino : rutaInicioPorRol(u), { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      setForm((f) => ({ ...f, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver al inicio</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Inicia sesión</h1>
          <p className="text-sm text-slate-500 font-medium mb-8">
            Accede a tu Aula Virtual (alumnos) o al panel de familias (padres y apoderados).
          </p>

          <div className="space-y-3 mb-6">
            {location.state?.registrado && (
              <Alerta tipo="exito">
                {location.state?.tipoCuenta === 'APODERADO'
                  ? '¡Cuenta creada! Inicia sesión y pide a la academia que te vincule con tu hijo o hija para ver su avance.'
                  : '¡Cuenta creada! Ya puedes iniciar sesión.'}
              </Alerta>
            )}
            {location.state?.salio && !error && <Alerta tipo="info">Cerraste sesión correctamente.</Alerta>}
            <Alerta tipo="error">{error}</Alerta>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="usuario" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Usuario o correo electrónico
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="usuario"
                  type="text"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  placeholder="tu usuario o tucorreo@ejemplo.com"
                  autoComplete="username"
                  maxLength={120}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            <CampoPassword
              id="password"
              label="Contraseña"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />

            <p className="text-xs text-slate-500 font-medium">
              ¿Olvidaste tu contraseña? Escríbenos por WhatsApp: el administrador te dará una contraseña temporal y la cambiarás al ingresar.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 hover:scale-[1.02]"
            >
              <LogIn className="w-5 h-5" aria-hidden="true" />
              <span>{loading ? 'Ingresando…' : 'Ingresar'}</span>
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium mt-8">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-600 font-extrabold hover:text-indigo-700">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
