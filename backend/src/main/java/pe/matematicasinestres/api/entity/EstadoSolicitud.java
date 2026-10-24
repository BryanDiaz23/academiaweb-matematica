package pe.matematicasinestres.api.entity;

import java.util.Set;

/**
 * Ciclo de vida de una solicitud de servicio (ITIL 4, gestión de solicitudes de servicio):
 * ABIERTA → EN_PROCESO → RESUELTA → CERRADA, con RECHAZADA como salida para lo que no procede.
 */
public enum EstadoSolicitud {
    ABIERTA, EN_PROCESO, RESUELTA, CERRADA, RECHAZADA;

    /** Estados a los que el administrador puede llevar la solicitud desde este. */
    public Set<EstadoSolicitud> siguientes() {
        return switch (this) {
            case ABIERTA -> Set.of(EN_PROCESO, RESUELTA, RECHAZADA);
            case EN_PROCESO -> Set.of(RESUELTA, RECHAZADA);
            case RESUELTA -> Set.of(EN_PROCESO, CERRADA);
            case CERRADA, RECHAZADA -> Set.of();
        };
    }

    /** Pendiente de atención: cuenta para el SLA y para el límite de solicitudes abiertas. */
    public boolean pendiente() {
        return this == ABIERTA || this == EN_PROCESO;
    }
}
