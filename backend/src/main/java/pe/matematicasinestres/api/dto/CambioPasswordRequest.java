package pe.matematicasinestres.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambioPasswordRequest(
        @NotBlank(message = "es obligatoria") @Size(max = 128) String passwordActual,
        @NotBlank(message = "es obligatoria") @Size(max = 128) String passwordNueva,
        @NotBlank(message = "es obligatoria") @Size(max = 128) String confirmarPassword
) {
    @Override
    public String toString() {
        return "CambioPasswordRequest[****]";
    }
}
