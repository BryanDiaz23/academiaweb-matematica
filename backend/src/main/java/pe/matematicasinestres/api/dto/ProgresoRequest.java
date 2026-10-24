package pe.matematicasinestres.api.dto;

/** Cambios de progreso: cada campo es opcional; solo se modifican los que llegan (no nulos). */
public record ProgresoRequest(Boolean vista, Boolean favorita) {
}
