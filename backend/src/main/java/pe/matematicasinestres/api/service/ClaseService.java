package pe.matematicasinestres.api.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.ClaseAdminDto;
import pe.matematicasinestres.api.dto.ClaseAlumnoDto;
import pe.matematicasinestres.api.dto.ClaseDto;
import pe.matematicasinestres.api.dto.ClaseRequest;
import pe.matematicasinestres.api.dto.ProgresoDto;
import pe.matematicasinestres.api.dto.ProgresoRequest;
import pe.matematicasinestres.api.entity.ClaseGrabada;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.entity.ProgresoClase;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.ClaseGrabadaRepository;
import pe.matematicasinestres.api.repository.MatriculaRepository;
import pe.matematicasinestres.api.repository.NivelRepository;
import pe.matematicasinestres.api.repository.ProgresoClaseRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClaseService {

    private final ClaseGrabadaRepository clases;
    private final MatriculaRepository matriculas;
    private final NivelRepository niveles;
    private final UsuarioRepository usuarios;
    private final ProgresoClaseRepository progresos;

    public ClaseService(ClaseGrabadaRepository clases, MatriculaRepository matriculas, NivelRepository niveles,
                        UsuarioRepository usuarios, ProgresoClaseRepository progresos) {
        this.clases = clases;
        this.matriculas = matriculas;
        this.niveles = niveles;
        this.usuarios = usuarios;
        this.progresos = progresos;
    }

    // ---------------------------------------------------------------- Alumno

    @Transactional(readOnly = true)
    public List<ClaseAlumnoDto> listarParaAlumno(Long usuarioId, String buscar) {
        String texto = buscar == null ? "" : buscar.trim();
        if (texto.length() > 100) {
            texto = texto.substring(0, 100);
        }
        Map<Long, ProgresoClase> progreso = progresoDe(usuarioId);
        return clases.buscarParaAlumno(usuarioId, EstadoMatricula.ACTIVA, texto, LocalDate.now()).stream()
                .map(c -> ClaseAlumnoDto.from(c, progreso.get(c.getId())))
                .toList();
    }

    /**
     * Control de acceso a nivel de objeto (OWASP A01 / IDOR): además de tener rol ALUMNO,
     * el alumno debe tener matrícula ACTIVA y no vencida en el nivel de la clase solicitada.
     */
    @Transactional(readOnly = true)
    public ClaseAlumnoDto detalleParaAlumno(Long usuarioId, Long claseId) {
        ClaseGrabada c = claseAccesible(usuarioId, claseId);
        return ClaseAlumnoDto.from(c, progresos.findByUsuarioYClase(usuarioId, claseId).orElse(null));
    }

    /** Registra que el alumno abrió la clase (alimenta "Continuar viendo"). Exige matrícula vigente. */
    @Transactional
    public ProgresoDto registrarAcceso(Long usuarioId, Long claseId) {
        ClaseGrabada c = claseAccesible(usuarioId, claseId);
        ProgresoClase p = progresoParaEditar(usuarioId, c);
        p.setUltimaVez(LocalDateTime.now());
        return ProgresoDto.from(claseId, progresos.save(p));
    }

    /** Marca la clase como vista y/o favorita. Exige matrícula vigente en el nivel de la clase. */
    @Transactional
    public ProgresoDto actualizarProgreso(Long usuarioId, Long claseId, ProgresoRequest req) {
        ClaseGrabada c = claseAccesible(usuarioId, claseId);
        ProgresoClase p = progresoParaEditar(usuarioId, c);
        if (req.vista() != null) {
            p.setVista(req.vista());
            if (req.vista()) {
                p.setUltimaVez(LocalDateTime.now());
            }
        }
        if (req.favorita() != null) {
            p.setFavorita(req.favorita());
        }
        return ProgresoDto.from(claseId, progresos.save(p));
    }

    private ClaseGrabada claseAccesible(Long usuarioId, Long claseId) {
        ClaseGrabada c = clases.findById(claseId)
                .filter(ClaseGrabada::isPublicada)
                .orElseThrow(() -> ApiException.noEncontrado("Clase"));
        boolean vigente = matriculas.tieneMatriculaVigente(
                usuarioId, c.getNivel().getId(), EstadoMatricula.ACTIVA, LocalDate.now());
        if (!vigente) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No tienes una matrícula activa y vigente en el nivel de esta clase.");
        }
        return c;
    }

    private ProgresoClase progresoParaEditar(Long usuarioId, ClaseGrabada clase) {
        return progresos.findByUsuarioYClase(usuarioId, clase.getId()).orElseGet(() -> {
            ProgresoClase nuevo = new ProgresoClase();
            nuevo.setUsuario(usuarios.getReferenceById(usuarioId));
            nuevo.setClase(clase);
            return nuevo;
        });
    }

    private Map<Long, ProgresoClase> progresoDe(Long usuarioId) {
        Map<Long, ProgresoClase> mapa = new HashMap<>();
        for (ProgresoClase p : progresos.findByUsuario(usuarioId)) {
            mapa.put(p.getClase().getId(), p);
        }
        return mapa;
    }

    // ---------------------------------------------------------------- Admin

    @Transactional(readOnly = true)
    public List<ClaseAdminDto> listarTodas() {
        Map<Long, Long> vistas = contar(progresos.contarVistasPorClase());
        Map<Long, Long> favoritas = contar(progresos.contarFavoritasPorClase());
        return clases.findAllByOrderByFechaClaseDesc().stream()
                .map(c -> ClaseAdminDto.from(c, vistas.getOrDefault(c.getId(), 0L), favoritas.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    private static Map<Long, Long> contar(List<Object[]> filas) {
        Map<Long, Long> mapa = new HashMap<>();
        for (Object[] fila : filas) {
            mapa.put(((Number) fila[0]).longValue(), ((Number) fila[1]).longValue());
        }
        return mapa;
    }

    @Transactional
    public ClaseDto crear(ClaseRequest req, Long adminId) {
        ClaseGrabada c = new ClaseGrabada();
        aplicar(c, req);
        c.setCreadoPor(usuarios.getReferenceById(adminId));
        return ClaseDto.from(clases.save(c));
    }

    @Transactional
    public ClaseDto actualizar(Long id, ClaseRequest req) {
        ClaseGrabada c = clases.findById(id).orElseThrow(() -> ApiException.noEncontrado("Clase"));
        aplicar(c, req);
        return ClaseDto.from(clases.save(c));
    }

    @Transactional
    public void eliminar(Long id) {
        ClaseGrabada c = clases.findById(id).orElseThrow(() -> ApiException.noEncontrado("Clase"));
        clases.delete(c);
    }

    private void aplicar(ClaseGrabada c, ClaseRequest req) {
        c.setTitulo(req.titulo().trim());
        c.setDescripcion(req.descripcion() == null || req.descripcion().isBlank() ? null : req.descripcion().trim());
        c.setNivel(niveles.findById(req.nivelId()).orElseThrow(() -> ApiException.noEncontrado("Nivel")));
        c.setDuracionMinutos(req.duracionMinutos());
        c.setFechaClase(req.fechaClase());
        c.setUrlVideo(req.urlVideo().trim());
        c.setUrlPizarra(req.urlPizarra() == null || req.urlPizarra().isBlank() ? null : req.urlPizarra().trim());
        c.setPublicada(req.publicada() == null || req.publicada());
    }
}
