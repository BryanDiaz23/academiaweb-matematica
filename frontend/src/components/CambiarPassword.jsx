import React, { useMemo, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { evaluarPassword } from '../utils/passwordPolicy';
import Alerta from './Alerta';
import CampoPassword from './CampoPassword';
import PasswordChecklist from './PasswordChecklist';

export default function CambiarPassword({ onExito, titulo = 'Cambiar contraseña', descripcion = 'La nueva contraseña debe cumplir la política de seguridad.' }) {
  const { usuario, actualizarUsuario } = useAuth();
  const [form, setForm] = useState({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
  const [estado, setEstado] = useState({ cargando: false, error: '', detalles: [], exito: '' });

  const evaluacion = useMemo(
    () => evaluarPassword(form.passwordNueva, [usuario?.nombreCompleto, usuario?.username, usuario?.email]),
    [form.passwordNueva, usuario]
  );
  const coinciden = form.passwordNueva.length > 0 && form.passwordNueva === form.confirmarPassword;
  const puedeEnviar = form.passwordActual && evaluacion.valida && coinciden && !estado.cargando;

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEstado({ cargando: true, error: '', detalles: [], exito: '' });
    try {
      const r = await api('/api/auth/password', { method: 'PUT', body: form });
      setForm({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
      setEstado({ cargando: false, error: '', detalles: [], exito: r.mensaje });
      if (usuario?.debeCambiarPassword) actualizarUsuario({ debeCambiarPassword: false });
      if (onExito) onExito();
    } catch (err) {
      setEstado({ cargando: false, error: err.message, detalles: err.detalles || [], exito: '' });
    }
  };

  return (
    <form onSubmit={enviar} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
          <KeyRound className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">{titulo}</h2>
          <p className="text-xs text-slate-500 font-medium">{descripcion}</p>
        </div>
      </div>
      <Alerta tipo="error" detalles={estado.detalles}>{estado.error}</Alerta>
      <Alerta tipo="exito">{estado.exito}</Alerta>
      <CampoPassword id="passwordActual" label={usuario?.debeCambiarPassword ? 'Contraseña temporal' : 'Contraseña actual'} value={form.passwordActual} onChange={cambiar} autoComplete="current-password" />
      <CampoPassword id="passwordNueva" label="Nueva contraseña" value={form.passwordNueva} onChange={cambiar} autoComplete="new-password" />
      <PasswordChecklist evaluacion={evaluacion} visible={form.passwordNueva.length > 0} />
      <CampoPassword id="confirmarPassword" label="Confirmar nueva contraseña" value={form.confirmarPassword} onChange={cambiar} autoComplete="new-password" />
      {form.confirmarPassword && !coinciden && (
        <p className="text-xs font-bold text-red-600">Las contraseñas no coinciden.</p>
      )}
      <button
        type="submit"
        disabled={!puedeEnviar}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
      >
        {estado.cargando ? 'Guardando…' : 'Actualizar contraseña'}
      </button>
    </form>
  );
}
