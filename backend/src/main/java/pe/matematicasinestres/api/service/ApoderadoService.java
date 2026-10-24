package pe.matematicasinestres.api.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.AvanceAlumnoDto;
import pe.matematicasinestres.api.dto.HijoResumenDto;
import pe.matematicasinestres.api.dto.MatriculaDto;
import pe.matematicasinestres.api.dto.VinculoDto;
import pe.matematicasinestres.api.dto.VinculoRequest;
import pe.matematicasinestres.api.entity.ClaseGrabada;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Matricula;
import pe.matematicasinestres.api.entity.Parentesco;
import pe.matematicasinestres.api.entity.ProgresoClase;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.entity.VinculoApoderado;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.ClaseGrabadaRepository;
import pe.matematicasinestres.api.repository.MatriculaRepository;
import pe.matematicasinestres.api.repository.ProgresoClaseRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;
import pe.matematicasinestres.api.repository.VinculoApoderadoRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Portal de apoderados: administración de vínculos padre-alumno y cálculo del avance.
 *
 * Control de acceso a nivel de objeto (OWASP A01 / IDOR): un apoderado solo consulta alumnos con
 * vínculo creado por el administrador. Un alumno inexistente y uno no vinculado reciben la misma
 * respuesta (403), para que no se pueda averiguar qué identificadores existen.
 */
@Service
public class ApoderadoService {

    /** Días sin abrir clases a partir de los cuales se avisa "sin actividad reciente". */
    static final int DIAS_SIN_ACTIVIDAD = 14;
    /** Semanas que muestra el gráfico de actividad. */
    static final int SEMANAS_GRAFICO = 6;
    private static final int CLASES_RECIENTES_MAX = 50;

    static final String AL_DIA = "AL_DIA";
    static final String COMPLETADO = "COMPLETADO";
    static final String NUEVO = "NUEVO";
    static final String SIN_ACTIVIDAD = "SIN_ACTIVIDAD";
    static final String PENDIENTE = "PENDIENTE";
    static final String SIN_MATRICULA = "SIN_MATRICULA";

    /** Más reciente primero; las clases que nunca abrió van al final, de la más nueva a la más antigua. */
    private static final Comparator<AvanceAlumnoDto.ClaseAvance> ORDEN_CLASES = (a, b) -> {
        if (a.ultimaVez() != null && b.ultimaVez() != null) {
            int porVez = b.ultimaVez().compareTo(a.ultimaVez());
            if (porVez != 0) {
                return porVez;
            }
        } else if (a.ultimaVez() != null) {
            return -1;
        } else if (b.ultimaVez() != null) {
            return 1;
        }
        return b.fechaClase().compareTo(a.fechaClase());
    };

    private static final String NO_VINCULADO = "Este alumno no está vinculado a tu cuenta.";

    private final VinculoApoderadoRepository vinculos;
    private final UsuarioRepository usuarios;
    private final MatriculaRepository matriculas;
    private final ClaseGrabadaRepository clases;
    private final ProgresoClaseRepository progresos;
    private final AuditoriaService auditoria;

    public ApoderadoService(VinculoApoderadoRepository vinculos, UsuarioRepository usuarios, MatriculaRepository matriculas,
                            ClaseGrabadaRepository clases, ProgresoClaseRepository progresos, AuditoriaService auditoria) {
        this.vinculos = vinculos;
        this.usuarios = usuarios;
        this.matriculas = matriculas;
        this.clases = clases;
        this.progresos = progresos;
        this.auditoria = auditoria;
    }

    // ------------------------------------------------------------ Apoderado

    @Transactional(readOnly = true)
    public List<HijoResumenDto> misHijos(Long apoderadoId) {
        LocalDate hoy = LocalDate.now();
        return vinculos.findByApoderadoIdOrderByCreadoEnAsc(apoderadoId).stream()
                .map(v -> {
                    AvanceAlumnoDto a = calcular(v.getAlumno(), v.getParentesco().name(), hoy);
                    return new HijoResumenDto(a.alumnoId(), a.nombre(), a.username(), a.parentesco(), a.niveles(),
                            a.totalClases(), a.clasesVistas(), a.porcentaje(), a.ultimaActividad(),
                            a.diasSinActividad(), a.estado(), a.diasParaVencer());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public AvanceAlumnoDto avance(Long apoderadoId, Long alumnoId) {
        VinculoApoderado v = vinculos.findByApoderadoIdAndAlumnoId(apoderadoId, alumnoId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, NO_VINCULADO));
        return calcular(v.getAlumno(), v.getParentesco().name(), LocalDate.now());
    }

    // ------------------------------------------------------------ Administrador

    /** El administrador puede ver el mismo informe de cualquier alumno (sin parentesco). */
    @Transactional(readOnly = true)
    public AvanceAlumnoDto avanceComoAdmin(Long alumnoId) {
        Usuario alumno = usuarios.findById(alumnoId)
                .filter(u -> Rol.ALUMNO.equals(u.getRol().getNombre()))
                .orElseThrow(() -> ApiException.noEncontrado("Alumno"));
        return calcular(alumno, null, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<VinculoDto> listarVinculos() {
        return vinculos.findAllByOrderByCreadoEnDesc().stream().map(VinculoDto::from).toList();
    }

    @Transactional
    public VinculoDto crearVinculo(VinculoRequest req, Long adminId, String ip) {
        Usuario apoderado = usuarios.findById(req.apoderadoId()).orElseThrow(() -> ApiException.noEncontrado("Apoderado"));
        Usuario alumno = usuarios.findById(req.alumnoId()).orElseThrow(() -> ApiException.noEncontrado("Alumno"));
        if (!Rol.APODERADO.equals(apoderado.getRol().getNombre())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La cuenta elegida no es de tipo apoderado.");
        }
        if (!Rol.ALUMNO.equals(alumno.getRol().getNombre())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La cuenta elegida como alumno no es de tipo alumno.");
        }
        if (vinculos.existsByApoderadoIdAndAlumnoId(apoderado.getId(), alumno.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Ese apoderado ya está vinculado con ese alumno.");
        }
        VinculoApoderado v = new VinculoApoderado();
        v.setApoderado(apoderado);
        v.setAlumno(alumno);
        v.setParentesco(req.parentesco() == null ? Parentesco.APODERADO : Parentesco.valueOf(req.parentesco()));
        v.setCreadoPor(usuarios.getReferenceById(adminId));
        vinculos.save(v);
        auditoria.registrar(apoderado, apoderado.getUsername(), EventoAuditoria.VINCULO_CREADO,
                "Vinculado con el alumno " + alumno.getUsername() + " (administrador #" + adminId + ")", ip);
        return VinculoDto.from(v);
    }

    @Transactional
    public void eliminarVinculo(Long id, Long adminId, String ip) {
        VinculoApoderado v = vinculos.findById(id).orElseThrow(() -> ApiException.noEncontrado("Vínculo"));
        Usuario apoderado = v.getApoderado();
        String alumno = v.getAlumno().getUsername();
        vinculos.delete(v);
        auditoria.registrar(apoderado, apoderado.getUsername(), EventoAuditoria.VINCULO_ELIMINADO,
                "Desvinculado del alumno " + alumno + " (administrador #" + adminId + ")", ip);
    }

    // ------------------------------------------------------------ Cálculo del avance

    /**
     * Calcula el avance con las mismas reglas que ve el alumno: solo cuentan las clases publicadas
     * de los niveles donde tiene una matrícula ACTIVA y vigente.
     */
    private AvanceAlumnoDto calcular(Usuario alumno, String parentesco, LocalDate hoy) {
        Long id = alumno.getId();
        List<Matricula> todas = matriculas.findByUsuarioIdOrderByCreadoEnDesc(id);
        List<Matricula> vigentes = todas.stream()
                .filter(m -> m.getEstado() == EstadoMatricula.ACTIVA && (m.getFechaFin() == null || !m.getFechaFin().isBefore(hoy)))
                .toList();
        boolean hayPendiente = todas.stream().anyMatch(m -> m.getEstado() == EstadoMatricula.PENDIENTE);

        List<ClaseGrabada> accesibles = clases.buscarParaAlumno(id, EstadoMatricula.ACTIVA, "", hoy);
        Map<Long, ProgresoClase> progreso = new HashMap<>();
        for (ProgresoClase p : progresos.findByUsuario(id)) {
            progreso.put(p.getClase().getId(), p);
        }

        int vistas = 0;
        int minutos = 0;
        LocalDateTime ultima = null;
        Map<String, int[]> porNivel = new LinkedHashMap<>();   // codigo -> [total, vistas]
        Map<String, String> nombreNivel = new HashMap<>();
        List<AvanceAlumnoDto.ClaseAvance> detalle = new ArrayList<>();
        for (ClaseGrabada c : accesibles) {
            ProgresoClase p = progreso.get(c.getId());
            boolean vista = p != null && p.isVista();
            LocalDateTime vez = p != null ? p.getUltimaVez() : null;
            int[] acumulado = porNivel.computeIfAbsent(c.getNivel().getCodigo(), k -> new int[2]);
            nombreNivel.put(c.getNivel().getCodigo(), c.getNivel().getNombre());
            acumulado[0]++;
            if (vista) {
                vistas++;
                minutos += c.getDuracionMinutos();
                acumulado[1]++;
            }
            if (vez != null && (ultima == null || vez.isAfter(ultima))) {
                ultima = vez;
            }
            detalle.add(new AvanceAlumnoDto.ClaseAvance(c.getId(), c.getTitulo(), c.getNivel().getNombre(),
                    c.getNivel().getCodigo(), c.getFechaClase(), c.getDuracionMinutos(), vista, vez));
        }
        // Primero lo más reciente que el alumno trabajó; luego las clases nuevas por fecha.
        detalle.sort(ORDEN_CLASES);
        if (detalle.size() > CLASES_RECIENTES_MAX) {
            detalle = new ArrayList<>(detalle.subList(0, CLASES_RECIENTES_MAX));
        }

        List<AvanceAlumnoDto.NivelAvance> niveles = porNivel.entrySet().stream()
                .map(e -> new AvanceAlumnoDto.NivelAvance(e.getKey(), nombreNivel.get(e.getKey()),
                        e.getValue()[0], e.getValue()[1], porcentaje(e.getValue()[1], e.getValue()[0])))
                .toList();

        Integer diasSinActividad = ultima == null ? null : (int) ChronoUnit.DAYS.between(ultima.toLocalDate(), hoy);
        Integer diasParaVencer = vigentes.stream()
                .filter(m -> m.getFechaFin() != null)
                .map(m -> (int) ChronoUnit.DAYS.between(hoy, m.getFechaFin()))
                .min(Integer::compareTo).orElse(null);
        LocalDate inicioMasAntiguo = vigentes.stream().map(Matricula::getFechaInicio)
                .filter(f -> f != null).min(LocalDate::compareTo).orElse(null);
        int total = accesibles.size();
        int pct = porcentaje(vistas, total);

        String estado;
        if (vigentes.isEmpty()) {
            estado = hayPendiente ? PENDIENTE : SIN_MATRICULA;
        } else if (diasSinActividad == null) {
            boolean recien = inicioMasAntiguo == null || !inicioMasAntiguo.isBefore(hoy.minusDays(DIAS_SIN_ACTIVIDAD));
            estado = recien ? NUEVO : SIN_ACTIVIDAD;
        } else if (diasSinActividad > DIAS_SIN_ACTIVIDAD) {
            estado = SIN_ACTIVIDAD;
        } else if (total > 0 && vistas == total) {
            estado = COMPLETADO;
        } else {
            estado = AL_DIA;
        }

        return new AvanceAlumnoDto(id, alumno.getNombreCompleto(), alumno.getUsername(), parentesco, LocalDateTime.now(),
                estado, total, vistas, pct, minutos, ultima, diasSinActividad, diasParaVencer,
                todas.stream().map(MatriculaDto::from).toList(), niveles, semanas(progreso, accesibles, hoy), detalle);
    }

    /** Clases vistas por semana (lunes a domingo) durante las últimas {@value #SEMANAS_GRAFICO} semanas. */
    private List<AvanceAlumnoDto.Semana> semanas(Map<Long, ProgresoClase> progreso, List<ClaseGrabada> accesibles, LocalDate hoy) {
        LocalDate lunesActual = hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<LocalDate, Integer> conteo = new LinkedHashMap<>();
        for (int i = SEMANAS_GRAFICO - 1; i >= 0; i--) {
            conteo.put(lunesActual.minusWeeks(i), 0);
        }
        for (ClaseGrabada c : accesibles) {
            ProgresoClase p = progreso.get(c.getId());
            if (p == null || !p.isVista() || p.getUltimaVez() == null) {
                continue;
            }
            LocalDate lunes = p.getUltimaVez().toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            conteo.computeIfPresent(lunes, (k, v) -> v + 1);
        }
        return conteo.entrySet().stream().map(e -> new AvanceAlumnoDto.Semana(e.getKey(), e.getValue())).toList();
    }

    private static int porcentaje(int parte, int total) {
        return total == 0 ? 0 : Math.round(parte * 100f / total);
    }
}
