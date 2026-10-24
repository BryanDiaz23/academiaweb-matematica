import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Paginacion } from '../../components/ui/ui';

/**
 * Ordena y pagina una lista. `clave` identifica el conjunto de filtros activo:
 * cuando cambia, vuelve a la primera página.
 */
export function useTabla(filas, { clave = '', porPaginaInicial = 10, ordenInicial = null, accesores = {} } = {}) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  const [orden, setOrden] = useState(ordenInicial);

  useEffect(() => {
    setPagina(1);
  }, [clave, porPagina]);

  const ordenadas = useMemo(() => {
    if (!orden || !accesores[orden.col]) return filas;
    const valor = accesores[orden.col];
    const dir = orden.dir === 'asc' ? 1 : -1;
    return [...filas].sort((a, b) => {
      const x = valor(a);
      const y = valor(b);
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'es', { numeric: true }) * dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, orden]);

  const paginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const actual = Math.min(pagina, paginas);
  const visibles = ordenadas.slice((actual - 1) * porPagina, actual * porPagina);

  const alternarOrden = (col) => {
    setOrden((o) => {
      if (!o || o.col !== col) return { col, dir: 'asc' };
      if (o.dir === 'asc') return { col, dir: 'desc' };
      return null;
    });
  };

  return { visibles, ordenadas, total: ordenadas.length, pagina: actual, setPagina, porPagina, setPorPagina, orden, alternarOrden };
}

/**
 * Tabla con encabezados ordenables.
 * columnas: [{ id, titulo, ordenable?, clase?, render: (fila) => nodo }]
 */
export function TablaDatos({ columnas, tabla, claveFila = (f) => f.id, vacio, etiqueta }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200" aria-label={etiqueta}>
          <thead className="bg-slate-50">
            <tr>
              {columnas.map((c) => {
                const activo = tabla.orden?.col === c.id;
                const Icono = !activo ? ArrowUpDown : tabla.orden.dir === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th key={c.id} scope="col" aria-sort={activo ? (tabla.orden.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {c.ordenable ? (
                      <button type="button" onClick={() => tabla.alternarOrden(c.id)} className="inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-slate-900">
                        {c.titulo} <Icono className={`w-3.5 h-3.5 ${activo ? 'text-indigo-600' : 'text-slate-300'}`} aria-hidden="true" />
                      </button>
                    ) : c.titulo}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tabla.visibles.map((fila) => (
              <tr key={claveFila(fila)} className="hover:bg-slate-50/60">
                {columnas.map((c) => (
                  <td key={c.id} className={`px-4 py-3.5 text-sm text-slate-700 align-top ${c.clase || ''}`}>{c.render(fila)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tabla.total === 0 && <p className="p-8 text-center text-sm text-slate-500 font-medium">{vacio}</p>}
      {tabla.total > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Paginacion pagina={tabla.pagina} total={tabla.total} porPagina={tabla.porPagina} onPagina={tabla.setPagina} onPorPagina={tabla.setPorPagina} />
        </div>
      )}
    </div>
  );
}

/** Botón pequeño para las acciones de cada fila. */
export const BTN_FILA = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 whitespace-nowrap';
export const BTN_FILA_TONO = {
  verde: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
  rojo: 'border-red-300 text-red-700 hover:bg-red-50',
  indigo: 'border-indigo-300 text-indigo-700 hover:bg-indigo-50',
  gris: 'border-slate-300 text-slate-700 hover:bg-slate-50',
  naranja: 'border-orange-300 text-orange-700 hover:bg-orange-50',
};

export function BotonFila({ tono = 'gris', icono: Icono, children, ...resto }) {
  return (
    <button type="button" className={`${BTN_FILA} ${BTN_FILA_TONO[tono]}`} {...resto}>
      {Icono && <Icono className="w-3.5 h-3.5" aria-hidden="true" />} {children}
    </button>
  );
}
