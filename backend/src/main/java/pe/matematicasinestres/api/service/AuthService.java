package pe.matematicasinestres.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.*;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.RolRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;
import pe.matematicasinestres.api.security.JwtService;
import pe.matematicasinestres.api.security.PasswordPolicy;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final String CREDENCIALES_INVALIDAS = "Usuario o contraseña incorrectos.";

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;
    private final PasswordPolicy politica;
    private final JwtService jwtService;
    private final AuditoriaService auditoria;
    private final int maxIntentos;
    private final int minutosBloqueo;
    /** Hash señuelo: se compara aunque el usuario no exista para igualar tiempos de respuesta. */
    private final String hashSenuelo;

    public AuthService(UsuarioRepository usuarios, RolRepository roles, PasswordEncoder encoder,
                       PasswordPolicy politica, JwtService jwtService, AuditoriaService auditoria,
                       @Value("${app.seguridad.max-intentos-fallidos}") int maxIntentos,
                       @Value("${app.seguridad.minutos-bloqueo}") int minutosBloqueo) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
        this.politica = politica;
        this.jwtService = jwtService;
        this.auditoria = auditoria;
        this.maxIntentos = maxIntentos;
        this.minutosBloqueo = minutosBloqueo;
        this.hashSenuelo = encoder.encode(UUID.randomUUID().toString());
    }

    /**
     * Inicio de sesión con protección contra fuerza bruta: tras N intentos fallidos
     * la cuenta se bloquea temporalmente. Los mensajes no revelan si el usuario existe.
     * noRollbackFor: los contadores y la auditoría se guardan aunque se responda con error.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse login(LoginRequest req, String ip) {
        String identificador = req.usuario().trim();
        Usuario u = usuarios.findByUsernameIgnoreCaseOrEmailIgnoreCase(identificador, identificador).orElse(null);

        if (u == null) {
            encoder.matches(req.password(), hashSenuelo);
            auditoria.registrar(null, identificador, EventoAuditoria.LOGIN_FALLIDO, "Usuario inexistente", ip);
            throw new ApiException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
        }

        if (u.estaBloqueado()) {
            auditoria.registrar(u, identificador, EventoAuditoria.LOGIN_CUENTA_BLOQUEADA, "Intento sobre cuenta bloqueada", ip);
            throw new ApiException(HttpStatus.LOCKED, mensajeBloqueo(u.getBloqueadoHasta()));
        }

        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            int intentos = u.getIntentosFallidos() + 1;
            if (intentos >= maxIntentos) {
                u.setIntentosFallidos(0);
                u.setBloqueadoHasta(LocalDateTime.now().plusMinutes(minutosBloqueo));
                usuarios.save(u);
                auditoria.registrar(u, identificador, EventoAuditoria.CUENTA_BLOQUEADA,
                        maxIntentos + " intentos fallidos consecutivos", ip);
                throw new ApiException(HttpStatus.LOCKED, mensajeBloqueo(u.getBloqueadoHasta()));
            }
            u.setIntentosFallidos(intentos);
            usuarios.save(u);
            auditoria.registrar(u, identificador, EventoAuditoria.LOGIN_FALLIDO,
                    "Contraseña incorrecta (intento " + intentos + " de " + maxIntentos + ")", ip);
            throw new ApiException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
        }

        if (!u.isActivo()) {
            auditoria.registrar(u, identificador, EventoAuditoria.LOGIN_CUENTA_INACTIVA, "Cuenta desactivada", ip);
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu cuenta está desactivada. Comunícate con la academia.");
        }

        u.setIntentosFallidos(0);
        u.setBloqueadoHasta(null);
        u.setUltimoAcceso(LocalDateTime.now());
        usuarios.save(u);
        auditoria.registrar(u, identificador, EventoAuditoria.LOGIN_EXITOSO, null, ip);
        return new AuthResponse(jwtService.generarToken(u), "Bearer", jwtService.getSegundosExpiracion(), UsuarioDto.from(u));
    }

    @Transactional
    public UsuarioDto registrar(RegisterRequest req, String ip) {
        String username = req.username().trim().toLowerCase(Locale.ROOT);
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        String nombre = req.nombreCompleto().trim().replaceAll("\\s+", " ");

        if (!req.password().equals(req.confirmarPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
        }
        List<String> errores = politica.validar(req.password(), nombre, username, email);
        if (!errores.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña no cumple la política de seguridad.", errores);
        }
        if (usuarios.existsByUsernameIgnoreCase(username) || usuarios.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "El nombre de usuario o el correo ya están registrados.");
        }

        // Solo se puede crear una cuenta de alumno o de apoderado; el rol ADMIN jamás se asigna por registro.
        boolean esApoderado = Rol.APODERADO.equals(req.tipoCuenta());
        String nombreRol = esApoderado ? Rol.APODERADO : Rol.ALUMNO;
        Rol rolNuevo = roles.findByNombre(nombreRol)
                .orElseThrow(() -> new IllegalStateException("No existe el rol " + nombreRol + " en la base de datos"));
        Usuario u = new Usuario();
        u.setNombreCompleto(nombre);
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRol(rolNuevo);
        usuarios.save(u);
        auditoria.registrar(u, username, EventoAuditoria.REGISTRO, esApoderado ? "Nueva cuenta de apoderado" : "Nueva cuenta de alumno", ip);
        return UsuarioDto.from(u);
    }

    @Transactional(readOnly = true)
    public UsuarioDto perfil(Long usuarioId) {
        return usuarios.findById(usuarioId).map(UsuarioDto::from)
                .orElseThrow(() -> ApiException.noEncontrado("Usuario"));
    }

    @Transactional
    public MensajeResponse cambiarPassword(Long usuarioId, CambioPasswordRequest req, String ip) {
        Usuario u = usuarios.findById(usuarioId).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        if (!encoder.matches(req.passwordActual(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta.");
        }
        if (!req.passwordNueva().equals(req.confirmarPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
        }
        if (encoder.matches(req.passwordNueva(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe ser distinta de la actual.");
        }
        List<String> errores = politica.validar(req.passwordNueva(), u.getNombreCompleto(), u.getUsername(), u.getEmail());
        if (!errores.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña no cumple la política de seguridad.", errores);
        }
        u.setPasswordHash(encoder.encode(req.passwordNueva()));
        u.setDebeCambiarPassword(false);
        usuarios.save(u);
        auditoria.registrar(u, u.getUsername(), EventoAuditoria.CAMBIO_PASSWORD, null, ip);
        return new MensajeResponse("Contraseña actualizada correctamente.");
    }

    private String mensajeBloqueo(LocalDateTime hasta) {
        long minutos = Math.max(1, Duration.between(LocalDateTime.now(), hasta).toMinutes() + 1);
        return "Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente en " + minutos + " minuto(s).";
    }
}
