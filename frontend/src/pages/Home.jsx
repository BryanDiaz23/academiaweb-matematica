import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  CheckCircle,
  Menu,
  X,
  Sparkles,
  Zap,
  Smile,
  Target,
  Brain,
  CheckCircle2,
  Clock,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Tag,
  Video,
  FolderDown,
  Lock,
  LogIn,
  LayoutDashboard,
  Send,
  UserPlus,
  ClipboardCheck,
  BadgeCheck,
  PlayCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { api } from '../api/client';
import { enlaceWhatsApp } from '../config';
import ChatFlotante from '../components/ChatFlotante';
import { rutaInicioPorRol, useAuth } from '../context/AuthContext';
import { formatearDuracion, formatearFecha, formatearPrecio } from '../utils/format';

// Estilos visuales por nivel (el contenido viene de la base de datos)
const ESTILO_NIVEL = {
  PRIMARIA: {
    icon: <Smile className="w-8 h-8 text-emerald-500" />,
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-300",
    cardBg: "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    btnBg: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25",
    priceColor: "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400",
    textColor: "text-emerald-600",
    priceBtn: "bg-emerald-500 hover:bg-emerald-600 text-white",
    classBadge: "bg-emerald-100 text-emerald-800",
    corto: "Primaria"
  },
  SECUNDARIA: {
    icon: <Brain className="w-8 h-8 text-indigo-600" />,
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-300",
    cardBg: "bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100 ring-2 ring-indigo-500/20",
    btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25",
    priceColor: "border-indigo-300 bg-indigo-50/50 hover:border-indigo-500 ring-2 ring-indigo-500/20",
    textColor: "text-indigo-600",
    priceBtn: "bg-indigo-600 hover:bg-indigo-700 text-white",
    classBadge: "bg-indigo-100 text-indigo-800",
    corto: "Secundaria"
  },
  PRE: {
    icon: <Target className="w-8 h-8 text-violet-600" />,
    badgeColor: "bg-violet-100 text-violet-700 border-violet-300",
    cardBg: "bg-white border-violet-200 hover:border-violet-400 hover:shadow-violet-100",
    btnBg: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25",
    priceColor: "border-violet-200 bg-violet-50/50 hover:border-violet-400",
    textColor: "text-violet-600",
    priceBtn: "bg-violet-600 hover:bg-violet-700 text-white",
    classBadge: "bg-violet-100 text-violet-800",
    corto: "PRE"
  }
};

const ESTILO_TURNO = {
  "Mañana": { icon: <Sun className="w-6 h-6 text-amber-500" />, badgeBg: "bg-amber-100 text-amber-800 border-amber-300" },
  "Tarde": { icon: <Sunset className="w-6 h-6 text-orange-500" />, badgeBg: "bg-orange-100 text-orange-800 border-orange-300" },
  "Noche": { icon: <Moon className="w-6 h-6 text-indigo-600" />, badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-300" }
};

// Datos de respaldo: se muestran solo si la API todavía no responde (p. ej. el servidor está despertando).
const NIVELES_RESPALDO = [
  { id: 1, codigo: "PRIMARIA", nombre: "Nivel Primaria", subtitulo: "Construye bases sólidas sin miedo ni aburrimiento", rangoEdad: "Ideal 6 a 11 años", precioMensual: 25, destacado: false,
    caracteristicas: ["Juegos de lógica y razonamiento", "Operaciones fundamentales paso a paso", "Paciencia total y clases didácticas", "Acompañamiento en tareas escolares"] },
  { id: 2, codigo: "SECUNDARIA", nombre: "Nivel Secundaria", subtitulo: "Asegura buenas notas y domina tus exámenes", rangoEdad: "1.º a 5.º de Secundaria", precioMensual: 35, destacado: true,
    caracteristicas: ["Álgebra, Geometría y Trigonometría", "Resolución de prácticas del colegio", "Preparación para bimestrales y parciales", "Estrategias sin memorizar fórmulas a ciegas"] },
  { id: 3, codigo: "PRE", nombre: "Nivel Preuniversitario", subtitulo: "Ingresa a la universidad con métodos de alta velocidad", rangoEdad: "Postulantes y Ciclo Cero", precioMensual: 35, destacado: false,
    caracteristicas: ["Trucos y atajos tipo examen de admisión", "Simulacros intensivos cronometrados", "Solucionarios de exámenes de admisión", "Ciclo Cero y Preparación Avanzada"] }
];

const HORARIOS_RESPALDO = [
  { id: 1, turno: "Mañana", horaInicio: "08:00", horaFin: "09:30", dias: "Lunes a Viernes" },
  { id: 2, turno: "Tarde", horaInicio: "17:00", horaFin: "18:30", dias: "Lunes a Viernes" },
  { id: 3, turno: "Noche", horaInicio: "19:00", horaFin: "20:30", dias: "Lunes a Viernes" }
];

function formatearHora(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { texto: `${h12}:${String(m).padStart(2, '0')}`, sufijo };
}

function rangoHorario(inicio, fin) {
  const a = formatearHora(inicio);
  const b = formatearHora(fin);
  return a.sufijo === b.sufijo ? `${a.texto} – ${b.texto} ${b.sufijo}` : `${a.texto} ${a.sufijo} – ${b.texto} ${b.sufijo}`;
}

const SOLICITUD_VACIA = { nombre: '', telefono: '', nivelId: '', mensaje: '' };

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { autenticado, usuario } = useAuth();
  const [niveles, setNiveles] = useState(NIVELES_RESPALDO);
  const [horarios, setHorarios] = useState(HORARIOS_RESPALDO);
  const [clasesRecientes, setClasesRecientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [solicitud, setSolicitud] = useState(SOLICITUD_VACIA);
  const [estadoSolicitud, setEstadoSolicitud] = useState({ cargando: false, error: '', exito: '' });

  const generateWhatsAppLink = enlaceWhatsApp;
  const rutaCuenta = autenticado ? rutaInicioPorRol(usuario) : '/login';
  const textoCuenta = autenticado ? (usuario?.rol === 'ADMIN' ? 'Panel Admin' : usuario?.rol === 'APODERADO' ? 'Panel de Familia' : 'Mi Aula Virtual') : 'Iniciar sesión';

  // Carga del contenido dinámico desde la base de datos (vía API REST)
  useEffect(() => {
    let activo = true;
    api('/api/public/niveles', { auth: false }).then((d) => activo && d?.length && setNiveles(d)).catch(() => {});
    api('/api/public/horarios', { auth: false }).then((d) => activo && d?.length && setHorarios(d)).catch(() => {});
    api('/api/public/clases-recientes', { auth: false }).then((d) => activo && setClasesRecientes(d || [])).catch(() => {});
    api('/api/public/estadisticas', { auth: false }).then((d) => activo && setEstadisticas(d)).catch(() => {});
    return () => { activo = false; };
  }, []);

  const levels = niveles.map((n) => {
    const estilo = ESTILO_NIVEL[n.codigo] || ESTILO_NIVEL.SECUNDARIA;
    return {
      id: n.id,
      title: n.nombre,
      subtitle: n.subtitulo,
      icon: estilo.icon,
      tag: n.rangoEdad,
      popular: n.destacado,
      badgeColor: estilo.badgeColor,
      cardBg: estilo.cardBg,
      btnBg: estilo.btnBg,
      features: n.caracteristicas || []
    };
  });

  const prices = niveles.map((n) => {
    const estilo = ESTILO_NIVEL[n.codigo] || ESTILO_NIVEL.SECUNDARIA;
    return {
      level: estilo.corto,
      price: formatearPrecio(n.precioMensual),
      period: "/mes",
      popular: n.destacado,
      color: estilo.priceColor,
      textColor: estilo.textColor,
      btnBg: estilo.priceBtn
    };
  });

  const schedules = horarios.map((h) => ({
    turn: h.turno,
    time: rangoHorario(h.horaInicio, h.horaFin),
    icon: (ESTILO_TURNO[h.turno] || ESTILO_TURNO.Noche).icon,
    badgeBg: (ESTILO_TURNO[h.turno] || ESTILO_TURNO.Noche).badgeBg
  }));

  const recordedClasses = clasesRecientes.map((c) => ({
    id: c.id,
    title: c.titulo,
    level: c.nivel,
    duration: formatearDuracion(c.duracionMinutos),
    date: `Clase del ${formatearFecha(c.fechaClase)}`,
    badgeBg: (ESTILO_NIVEL[c.nivelCodigo] || ESTILO_NIVEL.SECUNDARIA).classBadge
  }));

  const pillars = [
    {
      icon: <Zap className="w-7 h-7 text-amber-500" />,
      bgColor: "bg-amber-50 border-amber-200",
      title: "Método 100% Práctico",
      desc: "Menos teoría aburrida, más resolución guiada de ejercicios reales."
    },
    {
      icon: <Sparkles className="w-7 h-7 text-indigo-500" />,
      bgColor: "bg-indigo-50 border-indigo-200",
      title: "Clases en Vivo + Grabadas",
      desc: "Acceso ilimitado a las grabaciones en HD para repasar las veces que quieras."
    },
    {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      bgColor: "bg-emerald-50 border-emerald-200",
      title: "Atención por WhatsApp",
      desc: "Soporte constante para resolver dudas de tus tareas del colegio o academia."
    }
  ];

  const cambiarSolicitud = (e) => {
    setSolicitud({ ...solicitud, [e.target.name]: e.target.value });
    setEstadoSolicitud({ cargando: false, error: '', exito: '' });
  };

  const enviarSolicitud = async (e) => {
    e.preventDefault();
    if (solicitud.nombre.trim().length < 3 || !/^9\d{8}$/.test(solicitud.telefono.trim())) {
      setEstadoSolicitud({ cargando: false, error: 'Escribe tu nombre y un celular de 9 dígitos que empiece con 9.', exito: '' });
      return;
    }
    setEstadoSolicitud({ cargando: true, error: '', exito: '' });
    try {
      const r = await api('/api/public/solicitudes', {
        method: 'POST',
        auth: false,
        body: {
          nombre: solicitud.nombre.trim(),
          telefono: solicitud.telefono.trim(),
          nivelId: solicitud.nivelId ? Number(solicitud.nivelId) : null,
          mensaje: solicitud.mensaje.trim() || null
        }
      });
      setSolicitud(SOLICITUD_VACIA);
      setEstadoSolicitud({ cargando: false, error: '', exito: r.mensaje });
    } catch (err) {
      const detalle = err.detalles?.length ? ` (${err.detalles.join('; ')})` : '';
      setEstadoSolicitud({ cargando: false, error: err.message + detalle, exito: '' });
    }
  };

  const pasos = [
    { icon: <UserPlus className="w-6 h-6 text-white" />, bg: "bg-indigo-600", title: "Crea tu cuenta", desc: "Regístrate en minutos con una contraseña segura." },
    { icon: <ClipboardCheck className="w-6 h-6 text-white" />, bg: "bg-violet-600", title: "Solicita tu matrícula", desc: "Elige tu nivel y el turno que mejor te acomode." },
    { icon: <BadgeCheck className="w-6 h-6 text-white" />, bg: "bg-amber-500", title: "Validamos tu pago", desc: "La academia confirma tu pago y activa tu matrícula por un mes." },
    { icon: <PlayCircle className="w-6 h-6 text-white" />, bg: "bg-emerald-500", title: "Aprende 24/7", desc: "Entra a tu Aula Virtual y repasa las clases grabadas de tu nivel." }
  ];

  const precioDesde = niveles.reduce((min, n) => Math.min(min, Number(n.precioMensual) || min), Infinity);
  const tarjetasStats = [
    { valor: estadisticas ? String(estadisticas.clasesPublicadas) : '—', label: 'Clases grabadas disponibles', color: 'text-indigo-600' },
    { valor: estadisticas ? String(estadisticas.niveles) : String(niveles.length), label: 'Niveles: Primaria, Secundaria y PRE', color: 'text-emerald-500' },
    { valor: estadisticas ? String(estadisticas.turnos) : String(horarios.length), label: 'Turnos de lunes a viernes', color: 'text-amber-500' },
    { valor: Number.isFinite(precioDesde) ? `S/ ${formatearPrecio(precioDesde)}` : '—', label: 'Mensualidad desde, sin matrícula', color: 'text-pink-500' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* BANNER SUPERIOR INFORMATIVO */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white text-xs sm:text-sm font-semibold py-2.5 px-4 text-center shadow-md">
        <span>🎉 ¡Matrículas Abiertas! Separa tu vacante con clase de diagnóstico gratuita </span>
        <a 
          href="#diagnostico"
          className="underline font-bold ml-1 hover:text-amber-200"
        >
          Solicitar ahora &rarr;
        </a>
      </div>

      {/* HEADER / NAVBAR VIVO CON ENLACE DE CLASES GRABADAS */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* BRAND LOGO */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-indigo-500/30">
              M
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">
                Matemática <span className="text-indigo-600">Sin Estrés</span>
              </span>
              <span className="text-[10px] text-emerald-600 tracking-wider font-extrabold uppercase mt-1 block">
                Academia Virtual
              </span>
            </div>
          </div>

          {/* NAVEGACIÓN */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-bold text-slate-600">
            <a href="#niveles" className="hover:text-indigo-600 transition-colors">Niveles</a>
            <a href="#metodo" className="hover:text-indigo-600 transition-colors">Metodología</a>
            <a href="#horarios-precios" className="hover:text-indigo-600 transition-colors">Horarios y Precios</a>
            <a href="#clases-grabadas" className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>Clases Grabadas</span>
            </a>
            <a href="#como-funciona" className="hover:text-indigo-600 transition-colors">Cómo funciona</a>
            <a href="#padres" className="hover:text-indigo-600 transition-colors">Para padres</a>
            <Link to={rutaCuenta} className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1.5">
              {autenticado ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{textoCuenta}</span>
            </Link>
          </nav>

          {/* BOTÓN MATRÍCULA */}
          <a
            href={generateWhatsAppLink("Matrícula Directa")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Inscribirme Ahora</span>
          </a>

          {/* BOTÓN MENÚ MÓVIL */}
          <button 
            type="button"
            className="lg:hidden text-slate-700 p-2 rounded-xl bg-slate-100 border border-slate-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* MENÚ MÓVIL */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 pt-4 pb-6 space-y-4 shadow-xl">
            <a href="#niveles" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-700 hover:text-indigo-600">Niveles</a>
            <a href="#metodo" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-700 hover:text-indigo-600">Metodología</a>
            <a href="#horarios-precios" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-700 hover:text-indigo-600">Horarios y Precios</a>
            <a href="#clases-grabadas" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 font-black text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              <Video className="w-5 h-5" />
              <span>Descargar Clases Grabadas</span>
            </a>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-700 hover:text-indigo-600">Cómo funciona</a>
            <a href="#padres" onClick={() => setIsMenuOpen(false)} className="block font-bold text-slate-700 hover:text-indigo-600">Para padres</a>
            <Link
              to={rutaCuenta}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-2 font-bold text-slate-700 hover:text-indigo-600"
            >
              {autenticado ? <LayoutDashboard className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{textoCuenta}</span>
            </Link>
            <a 
              href={generateWhatsAppLink("Menú Móvil")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Contactar por WhatsApp</span>
            </a>
          </div>
        )}
      </header>

      {/* HERO SECTION DE COLORES LLAMATIVOS */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/60 via-purple-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <div className="inline-flex items-center space-x-2 bg-white border border-indigo-200 rounded-full px-4 py-2 mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-indigo-900">Aprende sin memorizar • 100% Entendible</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-5xl mx-auto mb-8">
            Las matemáticas que <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              sí se entienden y se disfrutan
            </span>.
          </h1>

          <p className="text-lg sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Refuerzo escolar y preuniversitario diseñado para que subas tus notas, le pierdas el miedo a los números y resuelvas exámenes con total seguridad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#clases-grabadas"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 text-center hover:scale-105 flex items-center justify-center space-x-2"
            >
              <FolderDown className="w-5 h-5" />
              <span>Descargar Clases Grabadas</span>
            </a>
            <a
              href={generateWhatsAppLink("Consulta Hero")}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white hover:bg-slate-100 border-2 border-emerald-500 text-emerald-700 font-extrabold px-8 py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-md hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              <span>Hablar por WhatsApp</span>
            </a>
          </div>

          {/* CIFRAS REALES (calculadas desde la base de datos) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
            {tarjetasStats.map((t) => (
              <div key={t.label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className={`text-3xl font-black ${t.color}`}>{t.valor}</p>
                <p className="text-xs text-slate-600 font-bold mt-1">{t.label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* METODOLOGÍA / PILARES */}
      <section id="metodo" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">¿Por qué nuestro método funciona?</h2>
            <p className="text-slate-600 font-medium">Nos enfocamos en el razonamiento lógico antes que en memorizar fórmulas sin sentido.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((item, idx) => (
              <div key={idx} className={`p-8 rounded-3xl border ${item.bgColor} shadow-sm transition-all hover:-translate-y-1`}>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 w-fit mb-5 shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN DE NIVELES */}
      <section id="niveles" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4">Elige tu Nivel de Aprendizaje</h2>
            <p className="text-slate-600 text-lg font-medium">Programas personalizados ajustados al grado y exigencia de cada alumno.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {levels.map((item) => (
              <div 
                key={item.id}
                className={`relative rounded-3xl border p-8 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-2 ${item.cardBg}`}
              >
                {item.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg">
                    🔥 Más Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      {item.icon}
                    </div>
                    <span className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${item.badgeColor}`}>
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 font-medium mb-8 leading-relaxed">{item.subtitle}</p>

                  <ul className="space-y-4 mb-8">
                    {item.features.map((feat, index) => (
                      <li key={index} className="flex items-start space-x-3 text-sm text-slate-700 font-medium">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={generateWhatsAppLink(item.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 px-4 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg hover:scale-105 ${item.btnBg}`}
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Consultar Vacantes</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HORARIOS Y PRECIOS */}
      <section id="horarios-precios" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-indigo-100 text-indigo-700 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full border border-indigo-200">
              Información de Clases
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 mb-3">Horarios y Precios</h2>
            <p className="text-slate-600 text-lg font-medium">
              Turnos de Lunes a Viernes. Clases durante todo el año.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-12">
            
            {/* BLOQUE DE HORARIOS */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Horarios Disponibles</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Lunes a Viernes</p>
                </div>
              </div>

              <div className="space-y-4">
                {schedules.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        {item.icon}
                      </div>
                      <div>
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${item.badgeBg}`}>
                          Turno {item.turn}
                        </span>
                        <p className="text-lg font-black text-slate-800 mt-1">{item.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 font-bold">
                  * La apertura de turnos por nivel puede variar según la demanda.
                </p>
              </div>
            </div>

            {/* BLOQUE DE PRECIOS */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Mensualidades</h3>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Sin Costo de Matrícula</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {prices.map((p, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border ${p.color} bg-white shadow-sm flex items-center justify-between transition-all hover:shadow-md`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black text-slate-900">{p.level}</span>
                        {p.popular && (
                          <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-indigo-300">
                            Recomendado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1">Acceso a clases en vivo y grabaciones</p>
                    </div>

                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <span className={`text-3xl font-black ${p.textColor}`}>S/ {p.price}</span>
                        <span className="text-xs font-bold text-slate-500">{p.period}</span>
                      </div>
                      <a
                        href={generateWhatsAppLink(`Mensualidad ${p.level}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-xl font-bold text-xs transition-all shadow-sm ${p.btnBg}`}
                        title="Matricularme"
                      >
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* NUEVA SECCIÓN: CLASES GRABADAS / AULA VIRTUAL */}
      <section id="clases-grabadas" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Adorno visual de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-indigo-500/20 text-indigo-300 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full border border-indigo-500/30">
              Aula Virtual • Repaso 24/7
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 mb-3">
              Centro de Clases Grabadas
            </h2>
            <p className="text-slate-300 text-lg font-medium">
              Si te perdiste una clase o quieres repasar antes de tu examen, aquí podrás descargar todas las grabaciones y los ejercicios trabajados.
            </p>
          </div>

          {/* TARJETA PRINCIPAL DE ACCESO DRIVE / ZOOM */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 backdrop-blur-md mb-12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center space-x-2 text-emerald-400 font-bold text-sm bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
                  <Lock className="w-4 h-4" />
                  <span>Acceso Exclusivo para Alumnos Matriculados</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Carpeta Oficial en Google Drive
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Todas las sesiones finalizadas se suben en resolución HD ordenadas por fecha, nivel y tema, junto con la pizarra virtual en formato PDF listo para descargar o imprimir.
                </p>
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
                <Link
                  to={rutaCuenta}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-8 py-4 rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-indigo-600/30 hover:scale-105"
                >
                  <FolderDown className="w-6 h-6" />
                  <span>{autenticado ? 'Ir a mis clases grabadas' : 'Iniciar sesión para ver grabaciones'}</span>
                </Link>

                <a
                  href={generateWhatsAppLink("Solicitar Acceso a Grabaciones")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-4 rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5 fill-slate-950" />
                  <span>Pedir Clave de Acceso</span>
                </a>
              </div>

            </div>
          </div>

          {/* ÚLTIMAS SESIONES GRABADAS (desde la base de datos; los enlaces solo se ven en el Aula Virtual) */}
          <div>
            <h4 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Video className="w-5 h-5 text-indigo-400" />
              <span>Últimas Sesiones Grabadas Disponibles</span>
            </h4>

            {recordedClasses.length === 0 && (
              <p className="text-slate-400 text-sm font-medium">Las últimas sesiones grabadas aparecerán aquí en unos instantes.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recordedClasses.map((cls) => (
                <div key={cls.id} className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${cls.badgeBg}`}>
                      {cls.level}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{cls.duration}</span>
                    </span>
                  </div>

                  <h5 className="text-lg font-black text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {cls.title}
                  </h5>

                  <p className="text-xs text-slate-400 font-medium mb-6">
                    {cls.date} • Incluye vídeo en HD y Pizarra PDF
                  </p>

                  <Link
                    to={rutaCuenta}
                    className="w-full py-3 px-4 bg-slate-700 hover:bg-indigo-600 text-white rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Ver en el Aula Virtual</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CLASE DE DIAGNÓSTICO GRATIS (formulario guardado en la base de datos) */}
      <section id="diagnostico" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full border border-emerald-200">
              Sin costo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">Solicita tu clase de diagnóstico</h2>
            <p className="text-slate-600 font-medium mb-6">
              Déjanos tus datos y un asesor te escribirá por WhatsApp para evaluar el nivel del alumno y recomendarte el mejor turno.
            </p>
            <ul className="space-y-3 text-sm font-semibold text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Evaluación personalizada de 30 minutos</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Recomendación de nivel y horario</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500" /> Tus datos se usan solo para contactarte</li>
            </ul>
          </div>

          <form onSubmit={enviarSolicitud} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4" noValidate>
            {estadoSolicitud.error && (
              <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{estadoSolicitud.error}</p>
            )}
            {estadoSolicitud.exito && (
              <p role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">{estadoSolicitud.exito}</p>
            )}
            <div>
              <label htmlFor="sol-nombre" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Nombre del alumno o apoderado</label>
              <input id="sol-nombre" name="nombre" value={solicitud.nombre} onChange={cambiarSolicitud} maxLength={100}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium focus:border-emerald-500 outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sol-telefono" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Celular (WhatsApp)</label>
                <input id="sol-telefono" name="telefono" inputMode="numeric" value={solicitud.telefono} onChange={cambiarSolicitud} maxLength={9} placeholder="9XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium focus:border-emerald-500 outline-none" />
              </div>
              <div>
                <label htmlFor="sol-nivel" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Nivel</label>
                <select id="sol-nivel" name="nivelId" value={solicitud.nivelId} onChange={cambiarSolicitud}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium focus:border-emerald-500 outline-none">
                  <option value="">Aún no sé</option>
                  {niveles.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="sol-mensaje" className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Mensaje (opcional)</label>
              <textarea id="sol-mensaje" name="mensaje" value={solicitud.mensaje} onChange={cambiarSolicitud} maxLength={500} rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium focus:border-emerald-500 outline-none" />
            </div>
            <button type="submit" disabled={estadoSolicitud.cargando}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
              <Send className="w-5 h-5" />
              {estadoSolicitud.cargando ? 'Enviando…' : 'Solicitar clase gratuita'}
            </button>
          </form>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">¿Cómo funciona?</h2>
            <p className="text-slate-600 font-medium">De tu primera consulta a tu primera clase en cuatro pasos.</p>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {pasos.map((p, idx) => (
              <li key={p.title} className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl ${p.bg} shadow-md`}>{p.icon}</div>
                  <span className="text-4xl font-black text-slate-200">{idx + 1}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{p.desc}</p>
              </li>
            ))}
          </ol>

          <div className="text-center mt-10">
            <Link to={autenticado ? rutaCuenta : '/register'} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-600/25">
              <UserPlus className="w-5 h-5" />
              <span>{autenticado ? 'Ir a mi cuenta' : 'Crear mi cuenta gratis'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PARA PADRES: cuenta de apoderado con el avance de sus hijos */}
      <section id="padres" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-violet-700 bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-full mb-5">
              <Users className="w-4 h-4" aria-hidden="true" /> Para padres de familia
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Mira cómo avanza tu hijo, sin preguntarle cada día</h2>
            <p className="text-slate-600 font-medium mb-6">
              Crea tu cuenta de apoderado y, cuando la academia la vincule con tu hijo o hija, tendrás un panel propio con su progreso real en las clases.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Clases vistas y porcentaje de avance por nivel.',
                'Actividad de las últimas semanas y aviso si deja de estudiar.',
                'Vigencia de la matrícula, para renovar a tiempo.',
                'Informe listo para imprimir o guardar en PDF.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to={autenticado && usuario?.rol === 'APODERADO' ? rutaCuenta : '/register?tipo=apoderado'} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-7 py-3.5 rounded-2xl shadow-lg shadow-violet-600/25">
                <UserPlus className="w-5 h-5" aria-hidden="true" />
                <span>{autenticado && usuario?.rol === 'APODERADO' ? 'Ir a mi panel de familia' : 'Crear cuenta de apoderado'}</span>
              </Link>
              {!autenticado && (
                <Link to="/login" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold px-7 py-3.5 rounded-2xl border border-slate-200">
                  <LogIn className="w-5 h-5" aria-hidden="true" />
                  <span>Ya tengo cuenta</span>
                </Link>
              )}
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-500">
              Por seguridad, solo la academia puede vincular a un apoderado con un alumno, después de verificar la relación.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-sm" aria-hidden="true">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 font-black flex items-center justify-center">CP</span>
              <div>
                <p className="font-black text-slate-900 leading-tight">Ejemplo de informe</p>
                <p className="text-xs font-bold text-emerald-600">Al día · Nivel Secundaria</p>
              </div>
              <span className="ml-auto text-2xl font-black text-indigo-600">62%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 overflow-hidden mb-6"><div className="h-3 rounded-full bg-indigo-600" style={{ width: '62%' }} /></div>
            <div className="flex items-end gap-3 h-24">
              {[1, 3, 2, 4, 3, 5].map((v, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-indigo-500/80" style={{ height: `${v * 18}%` }} />
              ))}
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Clases vistas por semana (datos de ejemplo)</p>
          </div>
        </div>
      </section>

      {/* BANNER FINAL / LLAMADO A LA ACCIÓN */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-6">
            ¿Listo para aprender matemática sin estrés?
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto font-medium">
            Solicita tu clase de diagnóstico o pide los horarios disponibles directamente en nuestro WhatsApp.
          </p>
          <a
            href={generateWhatsAppLink("Inscripción Final CTA")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-950/40 text-lg hover:scale-105"
          >
            <MessageCircle className="w-6 h-6 fill-slate-950" />
            <span>Chatear con un Asesor</span>
          </a>
        </div>
      </section>

      {/* FOOTER CLARO Y LIMPIO */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-xs font-semibold text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Matemática Sin Estrés. Todos los derechos reservados.</p>
          <div className="flex items-center space-x-4">
            <a href="#clases-grabadas" className="text-indigo-600 hover:underline font-bold">Descargar Grabaciones</a>
            <span>•</span>
            <span className="text-indigo-600 font-bold">Clases virtuales interactivas para todo el Perú</span>
          </div>
        </div>
      </footer>

      {/* ASISTENTE FLOTANTE: preguntas frecuentes (deriva a WhatsApp cuando no sabe) */}
      <ChatFlotante niveles={niveles} horarios={horarios} />

    </div>
  );
}
