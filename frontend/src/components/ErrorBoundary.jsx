import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Red de seguridad de la interfaz (ISO/IEC 25010 · Fiabilidad / tolerancia a fallos).
 * Si un componente lanza un error al dibujarse —o falla la descarga de una pantalla cargada bajo demanda,
 * por ejemplo justo después de un nuevo despliegue— se muestra un mensaje claro con opción de recargar
 * en lugar de dejar la página en blanco.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // No se envía a ningún servicio externo: queda solo en la consola del navegador.
    console.error('Error de interfaz capturado:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" role="alert">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Algo salió mal</h1>
          <p className="text-sm text-slate-600 font-medium mb-6">
            No pudimos mostrar esta pantalla. Recarga la página; si el problema continúa, escríbenos por WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Recargar
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-2xl"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }
}
