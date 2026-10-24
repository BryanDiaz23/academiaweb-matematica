import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <Logo size="lg" />
      <p className="mt-10 text-7xl font-black text-indigo-600">404</p>
      <h1 className="mt-2 text-2xl font-black text-slate-900">Página no encontrada</h1>
      <p className="mt-2 text-slate-600 font-medium">La dirección que buscas no existe o fue movida.</p>
      <Link to="/" className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl">
        Volver al inicio
      </Link>
    </div>
  );
}
