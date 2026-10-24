package pe.matematicasinestres.api.exception;

import java.time.LocalDateTime;
import java.util.List;

/** Formato uniforme de error. Nunca incluye trazas internas (evita fuga de información). */
public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String mensaje,
        String ruta,
        List<String> detalles
) {
    public static ApiError of(int status, String error, String mensaje, String ruta, List<String> detalles) {
        return new ApiError(LocalDateTime.now(), status, error, mensaje, ruta,
                detalles == null || detalles.isEmpty() ? null : detalles);
    }
}
