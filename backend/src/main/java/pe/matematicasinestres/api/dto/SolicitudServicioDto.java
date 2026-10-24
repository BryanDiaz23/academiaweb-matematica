package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.SolicitudServicio;

import java.time.LocalDateTime;

/**
 * Solicitud de servicio con su estado de SLA calculado:
 * EN_PLAZO, POR_VENCER (queda menos del 25 % del plazo), VENCIDA, CUMPLIDA o INCUMPLIDA.
 */
public record SolicitudServicioDto(
        Long id,
        String codigo,
        String tipo,
        String tipoNombre,
        String prioridad,
        String estado,
        String asunto,
        String descripcion,
        String respuesta,
        Long solicitanteId,
        String solicitante,
        String solicitanteUsername,
        String solicitanteRol,
        String atendidoPor,
        LocalDateTime creadoEn,
        LocalDateTime actualizadoEn,
        LocalDateTime venceEn,
        LocalDateTime resueltoEn,
        int horasSla,
        String estadoSla
) {
    public static SolicitudServicioDto from(SolicitudServicio s, String estadoSla) {
        return new SolicitudServicioDto(s.getId(), s.getCodigo(), s.getTipo().name(), s.getTipo().getNombre(),
                s.getPrioridad().name(), s.getEstado().name(), s.getAsunto(), s.getDescripcion(), s.getRespuesta(),
                s.getSolicitante().getId(), s.getSolicitante().getNombreCompleto(), s.getSolicitante().getUsername(),
                s.getSolicitante().getRol().getNombre(),
                s.getAtendidoPor() != null ? s.getAtendidoPor().getNombreCompleto() : null,
                s.getCreadoEn(), s.getActualizadoEn(), s.getVenceEn(), s.getResueltoEn(), s.getTipo().getHorasSla(), estadoSla);
    }
}
