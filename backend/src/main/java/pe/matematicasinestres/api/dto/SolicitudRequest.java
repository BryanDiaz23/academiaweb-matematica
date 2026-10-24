package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.matematicasinestres.api.validation.SinHtml;

public record SolicitudRequest(
        @NotBlank(message = "es obligatorio") @Size(min = 3, max = 100) @SinHtml String nombre,
        @NotBlank(message = "es obligatorio")
        @Pattern(regexp = "^9\\d{8}$", message = "debe ser un celular de 9 dígitos que empiece con 9")
        String telefono,
        @Email(message = "no tiene un formato de correo válido") @Size(max = 120) String email,
        Long nivelId,
        @Size(max = 500) @SinHtml String mensaje
) {
}
