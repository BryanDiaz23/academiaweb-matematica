package pe.matematicasinestres.api.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Tarjeta de un hijo en el panel del apoderado.
 * estado: AL_DIA | COMPLETADO | NUEVO | SIN_ACTIVIDAD | PENDIENTE | SIN_MATRICULA
 */
public record HijoResumenDto(
        Long alumnoId,
        String nombre,
        String username,
        String parentesco,
        List<AvanceAlumnoDto.NivelAvance> niveles,
        int totalClases,
        int clasesVistas,
        int porcentaje,
        LocalDateTime ultimaActividad,
        Integer diasSinActividad,
        String estado,
        Integer diasParaVencer
) {
}
