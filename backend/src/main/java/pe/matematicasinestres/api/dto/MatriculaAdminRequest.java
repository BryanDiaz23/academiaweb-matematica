package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Alta manual de una matrícula por el administrador (p. ej. cuando el alumno paga en ventanilla). */
public record MatriculaAdminRequest(
        @NotNull(message = "es obligatorio") Long usuarioId,
        @NotNull(message = "es obligatorio") Long nivelId,
        @NotNull(message = "es obligatorio") Long horarioId,
        /** Meses de vigencia a partir de hoy (por defecto 1). */
        @Min(value = 1, message = "debe ser al menos 1") @Max(value = 12, message = "no puede superar 12") Integer meses
) {
}
