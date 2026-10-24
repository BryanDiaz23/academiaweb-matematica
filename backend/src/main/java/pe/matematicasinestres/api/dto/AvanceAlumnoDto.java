package pe.matematicasinestres.api.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Informe de avance de un alumno para su apoderado (o para el administrador).
 * No incluye enlaces de video ni pizarras: el apoderado ve el avance, no el contenido pagado.
 */
public record AvanceAlumnoDto(
        Long alumnoId,
        String nombre,
        String username,
        String parentesco,
        LocalDateTime generadoEn,
        String estado,
        int totalClases,
        int clasesVistas,
        int porcentaje,
        int minutosVistos,
        LocalDateTime ultimaActividad,
        Integer diasSinActividad,
        Integer diasParaVencer,
        List<MatriculaDto> matriculas,
        List<NivelAvance> niveles,
        List<Semana> semanas,
        List<ClaseAvance> clases
) {
    /** Avance dentro de un nivel en el que el alumno tiene matrícula vigente. */
    public record NivelAvance(String codigo, String nombre, int total, int vistas, int porcentaje) {
    }

    /** Clases vistas con actividad en la semana que empieza el lunes {@code inicio}. */
    public record Semana(LocalDate inicio, int vistas) {
    }

    /** Estado de cada clase del alumno: título, nivel, fecha y si ya la vio. */
    public record ClaseAvance(Long id, String titulo, String nivel, String nivelCodigo, LocalDate fechaClase,
                              int duracionMinutos, boolean vista, LocalDateTime ultimaVez) {
    }
}
