package pe.matematicasinestres.api.dto;

/** Respuesta del restablecimiento: la contraseña temporal se muestra UNA sola vez al administrador. */
public record PasswordTemporalDto(String username, String passwordTemporal, String mensaje) {

    @Override
    public String toString() {
        return "PasswordTemporalDto[username=" + username + ", passwordTemporal=****]";
    }
}
