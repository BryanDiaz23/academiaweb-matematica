package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.matematicasinestres.api.validation.SinHtml;

public record RegisterRequest(
        @NotBlank(message = "es obligatorio")
        @Size(min = 3, max = 120, message = "debe tener entre 3 y 120 caracteres")
        @Pattern(regexp = "^[\\p{L} .'-]+$", message = "solo puede contener letras, espacios, apóstrofo, punto o guion")
        @SinHtml
        String nombreCompleto,

        @NotBlank(message = "es obligatorio")
        @Pattern(regexp = "^[a-zA-Z0-9._-]{4,40}$", message = "debe tener de 4 a 40 caracteres: letras, números, punto, guion o guion bajo")
        String username,

        @NotBlank(message = "es obligatorio")
        @Email(message = "no tiene un formato de correo válido")
        @Size(max = 120)
        String email,

        @NotBlank(message = "es obligatoria") @Size(max = 128) String password,
        @NotBlank(message = "es obligatoria") @Size(max = 128) String confirmarPassword,

        /** Opcional: ALUMNO (por defecto) o APODERADO. Nunca se puede elegir ADMIN al registrarse. */
        @Pattern(regexp = "^(ALUMNO|APODERADO)$", message = "debe ser ALUMNO o APODERADO")
        String tipoCuenta
) {
    @Override
    public String toString() {
        return "RegisterRequest[username=" + username + ", email=" + email + ", password=****]";
    }
}
