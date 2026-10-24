package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import pe.matematicasinestres.api.validation.SinHtml;

/** Cambio de estado de una solicitud por el administrador. RESUELTA y RECHAZADA exigen respuesta. */
public record AtencionSolicitudRequest(
        @NotBlank(message = "es obligatorio")
        @Pattern(regexp = "^(EN_PROCESO|RESUELTA|CERRADA|RECHAZADA)$", message = "debe ser EN_PROCESO, RESUELTA, CERRADA o RECHAZADA")
        String estado,
        @Size(max = 1000) @SinHtml String respuesta
) {
}
