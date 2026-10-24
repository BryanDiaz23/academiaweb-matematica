package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.matematicasinestres.api.validation.SinHtml;

public record SolicitudServicioRequest(
        @NotBlank(message = "es obligatorio")
        @Pattern(regexp = "^(INFORMACION|ACCESO_CUENTA|RESTABLECER_PASSWORD|CAMBIO_HORARIO|VINCULO_APODERADO|SOPORTE_TECNICO)$",
                message = "no es un tipo de solicitud del catálogo")
        String tipo,
        @NotBlank(message = "es obligatorio") @Size(min = 5, max = 120) @SinHtml String asunto,
        @NotBlank(message = "es obligatorio") @Size(min = 10, max = 1000) @SinHtml String descripcion
) {
}
