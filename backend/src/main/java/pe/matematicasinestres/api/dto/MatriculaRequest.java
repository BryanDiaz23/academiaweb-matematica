package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotNull;

public record MatriculaRequest(
        @NotNull(message = "es obligatorio") Long nivelId,
        @NotNull(message = "es obligatorio") Long horarioId
) {
}
