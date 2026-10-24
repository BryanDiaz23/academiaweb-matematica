package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoUsuarioRequest(@NotNull(message = "es obligatorio") Boolean activo) {
}
