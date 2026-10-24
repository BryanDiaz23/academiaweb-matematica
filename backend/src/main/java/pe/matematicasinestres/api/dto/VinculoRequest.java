package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record VinculoRequest(
        @NotNull(message = "es obligatorio") Long apoderadoId,
        @NotNull(message = "es obligatorio") Long alumnoId,
        @Pattern(regexp = "^(PADRE|MADRE|TUTOR|APODERADO)$", message = "debe ser PADRE, MADRE, TUTOR o APODERADO")
        String parentesco
) {
}
