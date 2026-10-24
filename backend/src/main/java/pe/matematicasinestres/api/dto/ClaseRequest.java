package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.*;
import pe.matematicasinestres.api.validation.SinHtml;

import java.time.LocalDate;

/**
 * Las URL se restringen a https:// para impedir enlaces "javascript:" o "data:"
 * que podrían ejecutar código al hacer clic (XSS a través de atributos href).
 */
public record ClaseRequest(
        @NotBlank(message = "es obligatorio") @Size(max = 150) @SinHtml String titulo,
        @Size(max = 500) @SinHtml String descripcion,
        @NotNull(message = "es obligatorio") Long nivelId,
        @NotNull(message = "es obligatoria") @Min(1) @Max(600) Integer duracionMinutos,
        @NotNull(message = "es obligatoria") LocalDate fechaClase,
        @NotBlank(message = "es obligatoria") @Size(max = 300)
        @Pattern(regexp = "^https://[^\\s<>\"']+$", message = "debe ser un enlace seguro que empiece con https://")
        String urlVideo,
        @Size(max = 300)
        @Pattern(regexp = "^$|^https://[^\\s<>\"']+$", message = "debe ser un enlace seguro que empiece con https://")
        String urlPizarra,
        Boolean publicada
) {
}
