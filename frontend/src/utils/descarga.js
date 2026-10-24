/** Descarga de archivos generados en el navegador (CSV, calendario .ics). */

export function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Evita la "inyección de fórmulas" en Excel: una celda que empieza con = + - @ se neutraliza con una comilla. */
function celda(valor) {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/**
 * Exporta filas a CSV (UTF-8 con BOM para que Excel respete las tildes).
 * columnas: [{ titulo, valor: (fila) => string|number }]
 */
export function descargarCSV(nombre, columnas, filas) {
  const encabezado = columnas.map((c) => celda(c.titulo)).join(',');
  const cuerpo = filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(','));
  const contenido = `﻿${[encabezado, ...cuerpo].join('\r\n')}`;
  descargarArchivo(nombre.endsWith('.csv') ? nombre : `${nombre}.csv`, contenido, 'text/csv;charset=utf-8');
}
