package pe.matematicasinestres.api.exception;

import org.springframework.http.HttpStatus;

import java.util.List;

/** Excepción de negocio que se traduce a una respuesta HTTP controlada. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final List<String> detalles;

    public ApiException(HttpStatus status, String mensaje) {
        this(status, mensaje, List.of());
    }

    public ApiException(HttpStatus status, String mensaje, List<String> detalles) {
        super(mensaje);
        this.status = status;
        this.detalles = detalles == null ? List.of() : List.copyOf(detalles);
    }

    public static ApiException noEncontrado(String recurso) {
        return new ApiException(HttpStatus.NOT_FOUND, recurso + " no encontrado(a).");
    }

    public HttpStatus getStatus() { return status; }
    public List<String> getDetalles() { return detalles; }
}
