import React from 'react';
import { TONOS } from './ui';

/** Gráfico de anillo con leyenda. datos: [{ etiqueta, valor, tono }] */
export function GraficoDonut({ datos, titulo, centro }) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const radio = 52;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0" role="img" aria-label={`${titulo}: ${datos.map((d) => `${d.etiqueta} ${d.valor}`).join(', ')}`}>
        <svg viewBox="0 0 140 140" className="w-36 h-36 -rotate-90">
          <circle cx="70" cy="70" r={radio} fill="none" stroke="#f1f5f9" strokeWidth="18" />
          {total > 0 && datos.filter((d) => d.valor > 0).map((d) => {
            const largo = (d.valor / total) * circunferencia;
            const trazo = (
              <circle key={d.etiqueta} cx="70" cy="70" r={radio} fill="none" stroke={(TONOS[d.tono] || TONOS.gris).hex} strokeWidth="18"
                strokeDasharray={`${largo} ${circunferencia - largo}`} strokeDashoffset={-acumulado} />
            );
            acumulado += largo;
            return trazo;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900">{centro ?? total}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{titulo}</span>
        </div>
      </div>
      <ul className="w-full space-y-2">
        {datos.map((d) => (
          <li key={d.etiqueta} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <span className="w-3 h-3 rounded-full" style={{ background: (TONOS[d.tono] || TONOS.gris).hex }} aria-hidden="true" />
              {d.etiqueta}
            </span>
            <span className="font-extrabold text-slate-900">{d.valor}{total > 0 && <span className="ml-1.5 text-xs font-bold text-slate-400">{Math.round((d.valor / total) * 100)}%</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras horizontales. datos: [{ etiqueta, valor, nota?, tono? }] */
export function BarrasHorizontales({ datos, formato = (v) => v }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <ul className="space-y-4">
      {datos.map((d) => (
        <li key={d.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="text-sm font-bold text-slate-700 truncate">{d.etiqueta}</span>
            <span className="text-sm font-black text-slate-900 shrink-0">{formato(d.valor)}{d.nota && <span className="ml-2 text-xs font-semibold text-slate-400">{d.nota}</span>}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-2.5 rounded-full ${(TONOS[d.tono] || TONOS.indigo).barra}`} style={{ width: `${(d.valor / max) * 100}%`, transition: 'width .5s ease' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Barras verticales agrupadas. series: [{ nombre, tono }], datos: [{ etiqueta, valores: [n, n] }]
 */
export function BarrasVerticales({ series, datos, alto = 160 }) {
  const max = Math.max(1, ...datos.flatMap((d) => d.valores));
  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: alto }} role="img"
        aria-label={datos.map((d) => `${d.etiqueta}: ${d.valores.map((v, i) => `${series[i].nombre} ${v}`).join(', ')}`).join('; ')}>
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex-1 h-full flex items-end justify-center gap-1">
            {d.valores.map((v, i) => (
              <div key={series[i].nombre} className="relative flex-1 max-w-[28px] flex flex-col justify-end h-full" title={`${series[i].nombre}: ${v}`}>
                <span className="text-[10px] font-extrabold text-slate-500 text-center mb-0.5">{v > 0 ? v : ''}</span>
                <div className={`w-full rounded-t-md ${(TONOS[series[i].tono] || TONOS.indigo).barra}`} style={{ height: `${(v / max) * 82}%`, minHeight: v > 0 ? 4 : 2, opacity: v > 0 ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-2">
        {datos.map((d) => (
          <span key={d.etiqueta} className="flex-1 text-center text-[11px] font-bold text-slate-500 capitalize">{d.etiqueta}</span>
        ))}
      </div>
      {series.length > 1 && (
        <div className="flex gap-4 mt-3 justify-center">
          {series.map((s) => (
            <span key={s.nombre} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: (TONOS[s.tono] || TONOS.indigo).hex }} aria-hidden="true" />{s.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
