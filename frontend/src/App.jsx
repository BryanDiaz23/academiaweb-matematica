import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Cargando from './components/Cargando';
import Home from './pages/Home';

// Carga diferida (code splitting): el visitante de la página principal no descarga el código del
// Aula ni del Panel de administración hasta que entra en ellos. Mejora el tiempo de carga inicial.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Aula = lazy(() => import('./pages/Aula'));
const Admin = lazy(() => import('./pages/Admin'));
const Familia = lazy(() => import('./pages/Familia'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CambiarPasswordObligatorio = lazy(() => import('./pages/CambiarPasswordObligatorio'));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Cargando texto="Cargando…" /></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/aula"
          element={
            <ProtectedRoute rol="ALUMNO">
              <Aula />
            </ProtectedRoute>
          }
        />
        <Route
          path="/familia"
          element={
            <ProtectedRoute rol="APODERADO">
              <Familia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute rol="ADMIN">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cambiar-password"
          element={
            <ProtectedRoute>
              <CambiarPasswordObligatorio />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
