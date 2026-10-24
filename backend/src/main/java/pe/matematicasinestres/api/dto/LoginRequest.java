package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Credenciales de inicio de sesión: se acepta usuario o correo. */
public record LoginRequest(
        @NotBlank(message = "es obligatorio") @Size(max = 120) String usuario,
        @NotBlank(message = "es obligatoria") @Size(max = 128) String password
) {
    @Override
    public String toString() {
        return "LoginRequest[usuario=" + usuario + ", password=****]";
    }
}
