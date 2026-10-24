import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AtSign, GraduationCap, Mail, User, UserPlus, Users, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { rutaInicioPorRol, useAuth } from '../context/AuthContext';
import { evaluarPassword, generarPasswordSegura } from '../utils/passwordPolicy';
import Alerta from '../components/Alerta';
import CampoPassword from '../components/CampoPassword';
import Logo from '../components/Logo';
import PasswordChecklist from '../components/PasswordChecklist';

const REGEX_USERNAME = /^[a-zA-Z0-9._-]{4,40}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_NOMBRE = /^[\p{L} .'-]{3,120}$/u;

const ESTILO_INPUT =
  'w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none font-medium text-slate-800 transition-all';

export default function Register() {
  const navigate = useNavigate();
  const { autenticado, usuario } = useAuth();
  const [params] = useSearchParams();
  // Se puede llegar con /register?tipo=apoderado desde la sección "Para padres" de la página principal.
  const [tipoCuenta, setTipoCuenta] = useState(params.get('tipo') === 'apoderado' ? 'APODERADO' : 'ALUMNO');
  const esApoderado = tipoCuenta === 'APODERADO';
  const [form, setForm] = useState({ nombreCompleto: '', username: '', email: '', password: '', confirmarPassword: '' });
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState('');
  const [detalles, setDetalles] = useState([]);
  const [loading, setLoading] = useState(false);

  const evaluacion = useMemo(
    () => evaluarPassword(form.password, [form.nombreCompleto, form.username, form.email]),
    [form.password, form.nombreCompleto, form.username, form.email]
  );

  if (autenticado) {
    return <Navigate to={rutaInicioPorRol(usuario)} replace />;
  }

  const coinciden = form.password.length > 0 && form.password === form.confirmarPassword;
  const erroresCampos = {
    nombreCompleto: form.nombreCompleto && !REGEX_NOMBRE.test(form.nombreCompleto.trim()) ? 'Usa solo letras y espacios (mínimo 3).' : '',
    username: form.username && !REGEX_USERNAME.test(form.username) ? 'De 4 a 40 caracteres: letras, números, punto, guion o guion bajo.' : '',
    email: form.email && !REGEX_EMAIL.test(form.email.trim()) ? 'Ingresa un correo válido.' : '',
  };
  const formularioValido =
    REGEX_NOMBRE.test(form.nombreCompleto.trim()) &&
    REGEX_USERNAME.test(form.username) &&
    REGEX_EMAIL.test(form.email.trim()) &&
    evaluacion.valida &&
    coinciden;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setDetalles([]);
  };

  const generar = () => {
    const nueva = generarPasswordSegura(18, [form.nombreCompleto, form.username, form.email]);
    setForm({ ...form, password: nueva, confirmarPassword: nueva });
    setVerPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formularioValido) {
      setError('Revisa los campos marcados: la contraseña debe cumplir todas las reglas de seguridad.');
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          nombreCompleto: form.nombreCompleto.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmarPassword: form.confirmarPassword,
          tipoCuenta,
        },
      });
      navigate('/login', { replace: true, state: { registrado: true, tipoCuenta, usuario: form.username.trim().toLowerCase() } });
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro.');
      setDetalles(err.detalles || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <Link to="/" className="inline-flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver al inicio</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10">
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Crea tu cuenta</h1>
          <p className="text-sm text-slate-500 font-medium mb-6">
            {esApoderado
              ? 'Crea tu cuenta de apoderado. La academia la vinculará con tu hijo o hija y podrás ver su avance.'
              : 'Regístrate para solicitar tu matrícula y acceder a tus clases grabadas.'}
          </p>

          <fieldset className="mb-6">
            <legend className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">¿Quién eres?</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'ALUMNO', texto: 'Soy alumno', Icono: GraduationCap },
                { id: 'APODERADO', texto: 'Soy padre, madre o apoderado', Icono: Users },
              ].map(({ id, texto, Icono }) => (
                <label key={id} className={`cursor-pointer rounded-2xl border-2 p-3.5 flex flex-col items-center gap-1.5 text-center text-sm font-extrabold transition-colors ${
                  tipoCuenta === id ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                } focus-within:ring-4 focus-within:ring-emerald-500/20`}>
                  <input type="radio" name="tipoCuenta" value={id} checked={tipoCuenta === id} onChange={() => setTipoCuenta(id)} className="sr-only" />
                  <Icono className="w-5 h-5" aria-hidden="true" />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-6">
            <Alerta tipo="error" detalles={detalles}>{error}</Alerta>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="nombreCompleto" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input id="nombreCompleto" name="nombreCompleto" type="text" value={form.nombreCompleto} onChange={handleChange}
                  placeholder="Tu nombre y apellido" autoComplete="name" maxLength={120} className={ESTILO_INPUT} />
              </div>
              {erroresCampos.nombreCompleto && <p className="mt-1.5 text-xs font-bold text-red-600">{erroresCampos.nombreCompleto}</p>}
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Nombre de usuario
              </label>
              <div className="relative">
                <AtSign className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input id="username" name="username" type="text" value={form.username} onChange={handleChange}
                  placeholder="ej. camila.paredes" autoComplete="username" maxLength={40} className={ESTILO_INPUT} />
              </div>
              {erroresCampos.username && <p className="mt-1.5 text-xs font-bold text-red-600">{erroresCampos.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="tucorreo@ejemplo.com" autoComplete="email" maxLength={120} className={ESTILO_INPUT} />
              </div>
              {erroresCampos.email && <p className="mt-1.5 text-xs font-bold text-red-600">{erroresCampos.email}</p>}
            </div>

            <div className="space-y-3">
              <CampoPassword id="password" label="Contraseña" value={form.password} onChange={handleChange}
                placeholder="Mínimo 12 caracteres, con símbolos" autoComplete="new-password" color="emerald"
                mostrar={verPassword} onToggle={() => setVerPassword((v) => !v)} />
              <button type="button" onClick={generar}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Generar una contraseña segura por mí
              </button>
              <PasswordChecklist evaluacion={evaluacion} visible={form.password.length > 0} />
            </div>

            <div>
              <CampoPassword id="confirmarPassword" label="Confirmar contraseña" value={form.confirmarPassword} onChange={handleChange}
                placeholder="Repite tu contraseña" autoComplete="new-password" color="emerald"
                mostrar={verPassword} onToggle={() => setVerPassword((v) => !v)} />
              {form.confirmarPassword && !coinciden && (
                <p className="mt-1.5 text-xs font-bold text-red-600">Las contraseñas no coinciden.</p>
              )}
            </div>

            {verPassword && evaluacion.valida && (
              <Alerta tipo="aviso">Guarda tu contraseña en un lugar seguro (por ejemplo, un gestor de contraseñas) antes de continuar.</Alerta>
            )}

            <button
              type="submit"
              disabled={loading || !formularioValido}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              <span>{loading ? 'Creando cuenta…' : 'Crear cuenta'}</span>
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 font-extrabold hover:text-indigo-700">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
