package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.Usuario;

import java.time.LocalDateTime;

/** Vista pública del usuario: nunca incluye el hash de la contraseña. */
public record UsuarioDto(
        Long id,
        String nombreCompleto,
        String username,
        String email,
        String rol,
        boolean activo,
        boolean bloqueado,
        LocalDateTime ultimoAcceso,
        LocalDateTime creadoEn,
        boolean debeCambiarPassword
) {
    public static UsuarioDto from(Usuario u) {
        return new UsuarioDto(u.getId(), u.getNombreCompleto(), u.getUsername(), u.getEmail(),
                u.getRol().getNombre(), u.isActivo(), u.estaBloqueado(), u.getUltimoAcceso(), u.getCreadoEn(),
                u.isDebeCambiarPassword());
    }
}
