package pe.matematicasinestres.api.dto;

import java.util.Map;

/** Indicadores de la mesa de ayuda para el seguimiento del SLA (revisión mensual del servicio). */
public record MetricasMesaAyudaDto(
        long total,
        long pendientes,
        long porVencer,
        long vencidas,
        long atendidas,
        double cumplimientoSla,
        double horasPromedioResolucion,
        Map<String, Long> porEstado,
        Map<String, Long> porTipo
) {
}
