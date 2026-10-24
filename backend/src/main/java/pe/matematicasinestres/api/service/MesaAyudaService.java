package pe.matematicasinestres.api.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.AtencionSolicitudRequest;
import pe.matematicasinestres.api.dto.CatalogoServicioDto;
import pe.matematicasinestres.api.dto.MetricasMesaAyudaDto;
import pe.matematicasinestres.api.dto.SolicitudServicioDto;
import pe.matematicasinestres.api.dto.SolicitudServicioRequest;
import pe.matematicasinestres.api.entity.EstadoSolicitud;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.SolicitudServicio;
import pe.matematicasinestres.api.entity.TipoSolicitud;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.SolicitudServicioRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Mesa de ayuda: gestión de solicitudes de servicio según ITIL 4.
 *
 * Reglas: el tipo debe estar en el catálogo del rol; un usuario no puede tener más de
 * {@value #MAX_PENDIENTES} solicitudes pendientes; cada solicitud vence según el SLA de su tipo;
 * un usuario solo ve las suyas (una ajena responde 404, igual que una inexistente).
 */
@Service
public class MesaAyudaService {

    static final int MAX_PENDIENTES = 5;
    /** Fracción del plazo restante por debajo de la cual la solicitud se marca "por vencer". */
    static final double UMBRAL_POR_VENCER = 0.25;

    private static final Set<EstadoSolicitud> PENDIENTES = Set.of(EstadoSolicitud.ABIERTA, EstadoSolicitud.EN_PROCESO);

    private final SolicitudServicioRepository solicitudes;
    private final UsuarioRepository usuarios;
    private final AuditoriaService auditoria;

    public MesaAyudaService(SolicitudServicioRepository solicitudes, UsuarioRepository usuarios, AuditoriaService auditoria) {
        this.solicitudes = solicitudes;
        this.usuarios = usuarios;
        this.auditoria = auditoria;
    }

    // ------------------------------------------------------------ Catálogo
    public List<CatalogoServicioDto> catalogo() {
        return Arrays.stream(TipoSolicitud.values()).map(CatalogoServicioDto::from).toList();
    }

    public List<CatalogoServicioDto> catalogoPara(String rol) {
        return Arrays.stream(TipoSolicitud.values()).filter(t -> t.permitidoPara(rol)).map(CatalogoServicioDto::from).toList();
    }

    // ------------------------------------------------------------ Alumno o apoderado
    @Transactional(readOnly = true)
    public List<SolicitudServicioDto> misSolicitudes(Long usuarioId) {
        LocalDateTime ahora = LocalDateTime.now();
        return solicitudes.findBySolicitanteIdOrderByCreadoEnDesc(usuarioId).stream().map(s -> aDto(s, ahora)).toList();
    }

    @Transactional
    public SolicitudServicioDto crear(Long usuarioId, SolicitudServicioRequest req, String ip) {
        Usuario yo = usuarios.findById(usuarioId).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        TipoSolicitud tipo = TipoSolicitud.valueOf(req.tipo());
        if (!tipo.permitidoPara(yo.getRol().getNombre())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Este tipo de solicitud no está disponible para tu cuenta.");
        }
        if (solicitudes.countBySolicitanteIdAndEstadoIn(usuarioId, PENDIENTES) >= MAX_PENDIENTES) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya tienes " + MAX_PENDIENTES
                    + " solicitudes pendientes. Espera a que atendamos alguna antes de registrar otra.");
        }
        SolicitudServicio s = new SolicitudServicio();
        s.setSolicitante(yo);
        s.setTipo(tipo);
        s.setPrioridad(tipo.getPrioridad());
        s.setAsunto(req.asunto().trim());
        s.setDescripcion(req.descripcion().trim());
        s = solicitudes.save(s);
        auditoria.registrar(yo, yo.getUsername(), EventoAuditoria.SOLICITUD_CREADA, s.getCodigo() + " " + tipo.name(), ip);
        return aDto(s, LocalDateTime.now());
    }

    /** El solicitante confirma que su solicitud resuelta quedó conforme: RESUELTA → CERRADA. */
    @Transactional
    public SolicitudServicioDto confirmarCierre(Long usuarioId, Long id) {
        SolicitudServicio s = solicitudes.findByIdAndSolicitanteId(id, usuarioId)
                .orElseThrow(() -> ApiException.noEncontrado("Solicitud"));
        if (s.getEstado() != EstadoSolicitud.RESUELTA) {
            throw new ApiException(HttpStatus.CONFLICT, "Solo puedes cerrar una solicitud que ya fue resuelta.");
        }
        s.setEstado(EstadoSolicitud.CERRADA);
        return aDto(s, LocalDateTime.now());
    }

    // ------------------------------------------------------------ Administrador
    @Transactional(readOnly = true)
    public List<SolicitudServicioDto> listarTodas() {
        LocalDateTime ahora = LocalDateTime.now();
        return solicitudes.findAllByOrderByCreadoEnDesc().stream().map(s -> aDto(s, ahora)).toList();
    }

    @Transactional
    public SolicitudServicioDto atender(Long id, AtencionSolicitudRequest req, Long adminId, String ip) {
        SolicitudServicio s = solicitudes.findById(id).orElseThrow(() -> ApiException.noEncontrado("Solicitud"));
        EstadoSolicitud nuevo = EstadoSolicitud.valueOf(req.estado());
        if (!s.getEstado().siguientes().contains(nuevo)) {
            throw new ApiException(HttpStatus.CONFLICT, "No se puede pasar una solicitud " + s.getEstado().name()
                    + " a " + nuevo.name() + ".");
        }
        String respuesta = req.respuesta() == null ? null : req.respuesta().trim();
        boolean exigeRespuesta = nuevo == EstadoSolicitud.RESUELTA || nuevo == EstadoSolicitud.RECHAZADA;
        if (exigeRespuesta && (respuesta == null || respuesta.length() < 5)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Escribe la respuesta para el usuario (mínimo 5 caracteres).");
        }
        Usuario admin = usuarios.findById(adminId).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        String anterior = s.getEstado().name();
        s.setEstado(nuevo);
        s.setAtendidoPor(admin);
        if (respuesta != null && !respuesta.isEmpty()) {
            s.setRespuesta(respuesta);
        }
        if (exigeRespuesta) {
            s.setResueltoEn(LocalDateTime.now());
        } else if (nuevo == EstadoSolicitud.EN_PROCESO) {
            s.setResueltoEn(null); // reapertura: el plazo vuelve a contar
        }
        auditoria.registrar(admin, admin.getUsername(), EventoAuditoria.SOLICITUD_ACTUALIZADA,
                s.getCodigo() + " " + anterior + " -> " + nuevo.name(), ip);
        return aDto(s, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public MetricasMesaAyudaDto metricas() {
        LocalDateTime ahora = LocalDateTime.now();
        List<SolicitudServicio> todas = solicitudes.findAll();
        Map<String, Long> porEstado = new LinkedHashMap<>();
        Arrays.stream(EstadoSolicitud.values()).forEach(e -> porEstado.put(e.name(), 0L));
        Map<String, Long> porTipo = new LinkedHashMap<>();
        Arrays.stream(TipoSolicitud.values()).forEach(t -> porTipo.put(t.name(), 0L));
        long pendientes = 0;
        long porVencer = 0;
        long vencidas = 0;
        long atendidas = 0;
        long enPlazo = 0;
        double horas = 0;
        for (SolicitudServicio s : todas) {
            porEstado.merge(s.getEstado().name(), 1L, Long::sum);
            porTipo.merge(s.getTipo().name(), 1L, Long::sum);
            String sla = estadoSla(s, ahora);
            if (s.getEstado().pendiente()) {
                pendientes++;
                if ("POR_VENCER".equals(sla)) porVencer++;
                if ("VENCIDA".equals(sla)) vencidas++;
            } else if (s.getResueltoEn() != null) {
                atendidas++;
                if ("CUMPLIDA".equals(sla)) enPlazo++;
                horas += Duration.between(s.getCreadoEn(), s.getResueltoEn()).toMinutes() / 60.0;
            }
        }
        double cumplimiento = atendidas == 0 ? 100.0 : redondear(100.0 * enPlazo / atendidas);
        double promedio = atendidas == 0 ? 0.0 : redondear(horas / atendidas);
        return new MetricasMesaAyudaDto(todas.size(), pendientes, porVencer, vencidas, atendidas, cumplimiento, promedio,
                porEstado, porTipo);
    }

    // ------------------------------------------------------------ SLA
    static String estadoSla(SolicitudServicio s, LocalDateTime ahora) {
        if (!s.getEstado().pendiente()) {
            LocalDateTime fin = s.getResueltoEn() != null ? s.getResueltoEn() : s.getActualizadoEn();
            return fin != null && fin.isAfter(s.getVenceEn()) ? "INCUMPLIDA" : "CUMPLIDA";
        }
        if (ahora.isAfter(s.getVenceEn())) {
            return "VENCIDA";
        }
        long total = Duration.between(s.getCreadoEn(), s.getVenceEn()).toSeconds();
        long restante = Duration.between(ahora, s.getVenceEn()).toSeconds();
        return total > 0 && restante < total * UMBRAL_POR_VENCER ? "POR_VENCER" : "EN_PLAZO";
    }

    private static SolicitudServicioDto aDto(SolicitudServicio s, LocalDateTime ahora) {
        return SolicitudServicioDto.from(s, estadoSla(s, ahora));
    }

    private static double redondear(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
