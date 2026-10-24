package pe.matematicasinestres.api.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.*;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.entity.SolicitudInformacion;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.*;
import pe.matematicasinestres.api.security.GeneradorPassword;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final UsuarioRepository usuarios;
    private final MatriculaRepository matriculas;
    private final ClaseGrabadaRepository clases;
    private final SolicitudInformacionRepository solicitudes;
    private final AuditoriaAccesoRepository auditoriaRepo;
    private final AuditoriaService auditoria;
    private final GeneradorPassword generador;
    private final PasswordEncoder encoder;

    public AdminService(UsuarioRepository usuarios, MatriculaRepository matriculas, ClaseGrabadaRepository clases,
                        SolicitudInformacionRepository solicitudes, AuditoriaAccesoRepository auditoriaRepo,
                        AuditoriaService auditoria, GeneradorPassword generador, PasswordEncoder encoder) {
        this.usuarios = usuarios;
        this.matriculas = matriculas;
        this.clases = clases;
        this.solicitudes = solicitudes;
        this.auditoriaRepo = auditoriaRepo;
        this.auditoria = auditoria;
        this.generador = generador;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public ResumenAdminDto resumen() {
        return new ResumenAdminDto(
                usuarios.count(),
                usuarios.countByRolNombre(Rol.ALUMNO),
                matriculas.countByEstado(EstadoMatricula.ACTIVA),
                matriculas.countByEstado(EstadoMatricula.PENDIENTE),
                clases.countByPublicadaTrue(),
                solicitudes.countByAtendidaFalse(),
                auditoriaRepo.countByEventoAndCreadoEnAfter(EventoAuditoria.LOGIN_FALLIDO, LocalDateTime.now().minusHours(24)));
    }

    @Transactional(readOnly = true)
    public List<UsuarioDto> usuarios() {
        return usuarios.findAllByOrderByCreadoEnDesc().stream().map(UsuarioDto::from).toList();
    }

    @Transactional
    public UsuarioDto cambiarEstado(Long id, boolean activo, Long adminId, String ip) {
        if (id.equals(adminId) && !activo) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No puedes desactivar tu propia cuenta.");
        }
        Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        u.setActivo(activo);
        usuarios.save(u);
        auditoria.registrar(u, u.getUsername(), activo ? EventoAuditoria.CUENTA_ACTIVADA : EventoAuditoria.CUENTA_DESACTIVADA,
                "Acción del administrador #" + adminId, ip);
        return UsuarioDto.from(u);
    }

    @Transactional
    public UsuarioDto desbloquear(Long id, Long adminId, String ip) {
        Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        u.setBloqueadoHasta(null);
        u.setIntentosFallidos(0);
        usuarios.save(u);
        auditoria.registrar(u, u.getUsername(), EventoAuditoria.CUENTA_DESBLOQUEADA, "Acción del administrador #" + adminId, ip);
        return UsuarioDto.from(u);
    }

    /**
     * Genera una contraseña temporal robusta, desbloquea la cuenta y obliga a cambiarla en el
     * siguiente ingreso. La contraseña temporal solo se devuelve en esta respuesta (no se guarda en claro).
     */
    @Transactional
    public PasswordTemporalDto restablecerPassword(Long id, Long adminId, String ip) {
        if (id.equals(adminId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Para tu propia cuenta usa la opción \"Cambiar contraseña\".");
        }
        Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        String temporal = generador.generar(u.getNombreCompleto(), u.getUsername(), u.getEmail());
        u.setPasswordHash(encoder.encode(temporal));
        u.setDebeCambiarPassword(true);
        u.setIntentosFallidos(0);
        u.setBloqueadoHasta(null);
        usuarios.save(u);
        auditoria.registrar(u, u.getUsername(), EventoAuditoria.PASSWORD_RESTABLECIDA, "Acción del administrador #" + adminId, ip);
        return new PasswordTemporalDto(u.getUsername(), temporal,
                "Entrega esta contraseña al usuario por un canal privado. Deberá cambiarla al iniciar sesión.");
    }

    @Transactional(readOnly = true)
    public List<SolicitudDto> solicitudes() {
        return solicitudes.findAllByOrderByCreadoEnDesc().stream().map(SolicitudDto::from).toList();
    }

    @Transactional
    public SolicitudDto marcarAtendida(Long id) {
        SolicitudInformacion s = solicitudes.findById(id).orElseThrow(() -> ApiException.noEncontrado("Solicitud"));
        s.setAtendida(true);
        return SolicitudDto.from(solicitudes.save(s));
    }

    @Transactional(readOnly = true)
    public List<AuditoriaDto> auditoria() {
        return auditoriaRepo.findTop100ByOrderByCreadoEnDesc().stream().map(AuditoriaDto::from).toList();
    }
}
