package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.ClaseGrabada;
import pe.matematicasinestres.api.entity.ProgresoClase;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Clase grabada tal como la ve un alumno: incluye su progreso personal (vista, favorita, última vez). */
public record ClaseAlumnoDto(
        Long id,
        String titulo,
        String descripcion,
        Long nivelId,
        String nivel,
        String nivelCodigo,
        int duracionMinutos,
        LocalDate fechaClase,
        String urlVideo,
        String urlPizarra,
        boolean publicada,
        boolean vista,
        boolean favorita,
        LocalDateTime ultimaVez
) {
    public static ClaseAlumnoDto from(ClaseGrabada c, ProgresoClase p) {
        return new ClaseAlumnoDto(c.getId(), c.getTitulo(), c.getDescripcion(), c.getNivel().getId(), c.getNivel().getNombre(),
                c.getNivel().getCodigo(), c.getDuracionMinutos(), c.getFechaClase(), c.getUrlVideo(), c.getUrlPizarra(),
                c.isPublicada(), p != null && p.isVista(), p != null && p.isFavorita(), p != null ? p.getUltimaVez() : null);
    }
}
