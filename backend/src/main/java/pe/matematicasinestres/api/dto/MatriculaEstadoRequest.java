package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotNull;
import pe.matematicasinestres.api.entity.EstadoMatricula;

import java.time.LocalDate;

public record MatriculaEstadoRequest(
        @NotNull(message = "es obligatorio") EstadoMatricula estado,
        LocalDate fechaInicio,
        LocalDate fechaFin
) {
}
