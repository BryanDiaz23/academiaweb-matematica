import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2, Clock, Download, FileText, Heart, LayoutGrid, List, PlayCircle, Search, Sparkles, Lock,
} from 'lucide-react';
import { enlaceWhatsAppTexto } from '../../config';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatearDuracion, formatearFecha, normalizar, urlSegura } from '../../utils/format';
import {
  BarraProgreso, BOTON_PRIMARIO, Chips, CampoBusqueda, EstadoVacio, Esqueleto, Insignia, Selector, TONO_NIVEL,
} from '../../components/ui/ui';
import { esNueva, useAula } from './contexto';

const BANDA = {
  PRIMARIA: 'from-emerald-400 to-teal-500',
  SECUNDARIA: 'from-indigo-500 to-violet-600',
  PRE: 'from-violet-500 to-fuchsia-600',
};

const POR_TANDA = 12;

function AccionesClase({ clase, alVer, alVista, alFavorita, compacto = false }) {
  const video = urlSegura(clase.urlVideo);
  const pizarra = urlSegura(clase.urlPizarra);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compacto ? '' : 'mt-auto pt-4'}`}>
      {video ? (
        <a href={video} target="_blank" rel="noopener noreferrer" onClick={() => alVer(clase)}
          className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs">
          <PlayCircle className="w-4 h-4" aria-hidden="true" /> Ver clase
        </a>
      ) : (
        <span className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 text-slate-400 rounded-xl font-extrabold text-xs">Enlace no disponible</span>
      )}
      {pizarra && (
        <a href={pizarra} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-xs" title="Descargar la pizarra en PDF">
          <FileText className="w-4 h-4" aria-hidden="true" /> Pizarra <Download className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      )}
      <button type="button" onClick={() => alVista(clase)} aria-pressed={clase.vista}
        className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-extrabold text-xs border transition-colors ${
          clase.vista ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
        }`} title={clase.vista ? 'Quitar la marca de vista' : 'Marcar como vista'}>
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {clase.vista ? 'Vista' : 'Marcar vista'}
      </button>
      <button type="button" onClick={() => alFavorita(clase)} aria-pressed={clase.favorita}
        aria-label={clase.favorita ? 'Quitar de favoritas' : 'Guardar en favoritas'} title={clase.favorita ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        className={`p-2.5 rounded-xl border transition-colors ${clase.favorita ? 'bg-pink-50 border-pink-300 text-pink-600' : 'bg-white border-slate-200 text-slate-400 hover:text-pink-500 hover:border-pink-300'}`}>
        <Heart className={`w-4 h-4 ${clase.favorita ? 'fill-pink-500' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}

function TarjetaClase({ clase, ...acciones }) {
  return (
    <article className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md ${clase.vista ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className={`h-24 bg-gradient-to-br ${BANDA[clase.nivelCodigo] || 'from-slate-400 to-slate-600'} relative flex items-center justify-center`}>
        <PlayCircle className="w-10 h-10 text-white/85" aria-hidden="true" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {esNueva(clase) && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-white text-emerald-700 flex items-center gap-1"><Sparkles className="w-3 h-3" aria-hidden="true" /> Nueva</span>}
          {clase.vista && <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Vista</span>}
        </div>
        <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full bg-black/25 text-white flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" /> {formatearDuracion(clase.duracionMinutos)}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <Insignia tono={TONO_NIVEL[clase.nivelCodigo] || 'gris'} className="self-start mb-2">{clase.nivel}</Insignia>
        <h3 className="text-base font-black text-slate-900 leading-snug">{clase.titulo}</h3>
        {clase.descripcion && <p className="text-sm text-slate-600 mt-1.5 line-clamp-3">{clase.descripcion}</p>}
        <p className="text-xs text-slate-500 font-semibold mt-3">Clase del {formatearFecha(clase.fechaClase)}</p>
        <AccionesClase clase={clase} {...acciones} />
      </div>
    </article>
  );
}

function FilaClase({ clase, ...acciones }) {
  return (
    <article className={`bg-white border rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-4 ${clase.vista ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className={`hidden lg:flex w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br ${BANDA[clase.nivelCodigo] || 'from-slate-400 to-slate-600'} items-center justify-center`}>
        <PlayCircle className="w-7 h-7 text-white/90" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Insignia tono={TONO_NIVEL[clase.nivelCodigo] || 'gris'}>{clase.nivel}</Insignia>
          {esNueva(clase) && <Insignia tono="verde">NUEVA</Insignia>}
          {clase.vista && <Insignia tono="verde"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Vista</Insignia>}
        </div>
        <h3 className="font-black text-slate-900 leading-snug">{clase.titulo}</h3>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">{formatearFecha(clase.fechaClase)} · {formatearDuracion(clase.duracionMinutos)}</p>
      </div>
      <div className="lg:w-[26rem]"><AccionesClase clase={clase} compacto {...acciones} /></div>
    </article>
  );
}

export default function MisClases() {
  const { clases, derivados, irA, actualizarProgreso, registrarApertura } = useAula();
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [nivel, setNivel] = useState('TODOS');
  const [orden, setOrden] = useState('recientes');
  const [vista, setVista] = useLocalStorage('mse:vista-clases', 'cuadricula');
  const [visibles, setVisibles] = useState(POR_TANDA);

  useEffect(() => {
    setVisibles(POR_TANDA);
  }, [buscar, filtro, nivel, orden]);

  const niveles = useMemo(() => {
    const mapa = new Map();
    (clases || []).forEach((c) => mapa.set(c.nivelCodigo, c.nivel));
    return [...mapa.entries()];
  }, [clases]);

  const cuentas = useMemo(() => {
    const todas = clases || [];
    return {
      todas: todas.length,
      pendientes: todas.filter((c) => !c.vista).length,
      vistas: todas.filter((c) => c.vista).length,
      favoritas: todas.filter((c) => c.favorita).length,
    };
  }, [clases]);

  const filtradas = useMemo(() => {
    const q = normalizar(buscar.trim());
    const lista = (clases || []).filter((c) => {
      if (filtro === 'pendientes' && c.vista) return false;
      if (filtro === 'vistas' && !c.vista) return false;
      if (filtro === 'favoritas' && !c.favorita) return false;
      if (nivel !== 'TODOS' && c.nivelCodigo !== nivel) return false;
      return !q || normalizar(`${c.titulo} ${c.descripcion || ''} ${c.nivel}`).includes(q);
    });
    const ordenadores = {
      recientes: (a, b) => b.fechaClase.localeCompare(a.fechaClase),
      antiguas: (a, b) => a.fechaClase.localeCompare(b.fechaClase),
      titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
      duracion: (a, b) => a.duracionMinutos - b.duracionMinutos,
    };
    return lista.sort(ordenadores[orden]);
  }, [clases, buscar, filtro, nivel, orden]);

  if (clases === null) {
    return (
      <div className="space-y-4">
        <Esqueleto className="h-14" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-72" />)}</div>
      </div>
    );
  }

  if (clases.length === 0) {
    return (
      <EstadoVacio icono={derivados.tieneActiva ? PlayCircle : Lock}
        titulo={derivados.tieneActiva ? 'Aún no hay clases publicadas en tu nivel' : 'Las clases se desbloquean con una matrícula activa'}
        texto={derivados.tieneActiva ? 'Apenas la academia suba una nueva sesión la verás aquí.' : 'Solicita tu matrícula o renueva la que venció para ver las sesiones grabadas.'}>
        {!derivados.tieneActiva && (
          <div className="flex flex-wrap gap-3 justify-center">
            <button type="button" onClick={() => irA('matriculas')} className={BOTON_PRIMARIO}>Ver mis matrículas</button>
            <a href={enlaceWhatsAppTexto('¡Hola! Quisiera información para activar mi matrícula en Matemática Sin Estrés.')} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-sm">Escribir por WhatsApp</a>
          </div>
        )}
      </EstadoVacio>
    );
  }

  const alVer = (c) => registrarApertura(c);
  const alVista = (c) => actualizarProgreso(c, { vista: !c.vista });
  const alFavorita = (c) => actualizarProgreso(c, { favorita: !c.favorita });
  const mostradas = filtradas.slice(0, visibles);

  return (
    <div className="space-y-6">
      {/* Progreso general */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-sm font-extrabold text-slate-800">Has visto {cuentas.vistas} de {cuentas.todas} clases</p>
            <p className="text-sm font-black text-indigo-600">{derivados.progreso}%</p>
          </div>
          <BarraProgreso valor={cuentas.vistas} max={cuentas.todas} tono={derivados.progreso === 100 ? 'verde' : 'indigo'} etiqueta="Progreso de clases vistas" />
        </div>
        <p className="text-xs font-semibold text-slate-500 sm:max-w-[14rem]">Marca cada clase al terminarla para llevar tu avance al día.</p>
      </div>

      {/* Herramientas */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <CampoBusqueda id="buscar-clase" valor={buscar} onCambiar={setBuscar} placeholder="Buscar por tema, título o nivel…" className="flex-1" />
          {niveles.length > 1 && (
            <Selector id="filtro-nivel" etiqueta="Filtrar por nivel" valor={nivel} onCambiar={setNivel} className="lg:w-52">
              <option value="TODOS">Todos los niveles</option>
              {niveles.map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
            </Selector>
          )}
          <Selector id="orden-clases" etiqueta="Ordenar clases" valor={orden} onCambiar={setOrden} className="lg:w-52">
            <option value="recientes">Más recientes primero</option>
            <option value="antiguas">Más antiguas primero</option>
            <option value="titulo">Título (A–Z)</option>
            <option value="duracion">Duración (menor a mayor)</option>
          </Selector>
          <div className="hidden sm:flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Tipo de vista">
            <button type="button" onClick={() => setVista('cuadricula')} aria-pressed={vista === 'cuadricula'} aria-label="Vista en cuadrícula"
              className={`p-2 rounded-lg ${vista === 'cuadricula' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button type="button" onClick={() => setVista('lista')} aria-pressed={vista === 'lista'} aria-label="Vista en lista"
              className={`p-2 rounded-lg ${vista === 'lista' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
        <Chips etiqueta="Filtrar clases" valor={filtro} onCambiar={setFiltro} opciones={[
          { id: 'todas', texto: 'Todas', cuenta: cuentas.todas },
          { id: 'pendientes', texto: 'Por ver', cuenta: cuentas.pendientes },
          { id: 'vistas', texto: 'Vistas', cuenta: cuentas.vistas },
          { id: 'favoritas', texto: 'Favoritas', cuenta: cuentas.favoritas },
        ]} />
      </div>

      {/* Resultados */}
      {filtradas.length === 0 ? (
        <EstadoVacio icono={Search} titulo="No encontramos clases con esos filtros"
          texto="Prueba con otra palabra o quita algún filtro.">
          <button type="button" onClick={() => { setBuscar(''); setFiltro('todas'); setNivel('TODOS'); }} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm hover:bg-slate-50">Limpiar filtros</button>
        </EstadoVacio>
      ) : (
        <>
          <p className="text-xs font-bold text-slate-500" aria-live="polite">{filtradas.length} clase(s)</p>
          {vista === 'lista' ? (
            <div className="space-y-3">
              {mostradas.map((c) => <FilaClase key={c.id} clase={c} alVer={alVer} alVista={alVista} alFavorita={alFavorita} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mostradas.map((c) => <TarjetaClase key={c.id} clase={c} alVer={alVer} alVista={alVista} alFavorita={alFavorita} />)}
            </div>
          )}
          {visibles < filtradas.length && (
            <div className="flex justify-center">
              <button type="button" onClick={() => setVisibles((v) => v + POR_TANDA)} className="px-6 py-3 rounded-xl border border-slate-200 bg-white font-extrabold text-sm text-slate-700 hover:bg-slate-50">
                Mostrar más ({filtradas.length - visibles} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

