package pe.matematicasinestres.api.dto;

public record AuthResponse(String token, String tipo, long expiraEnSegundos, UsuarioDto usuario) {
}
