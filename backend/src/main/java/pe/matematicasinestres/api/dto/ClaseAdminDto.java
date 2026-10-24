package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.ClaseGrabada;

import java.time.LocalDate;

/** Clase vista desde el panel de administración: añade cuántos alumnos la vieron o la guardaron. */
public record ClaseAdminDto(
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
        long vistas,
        long favoritas
) {
    public static ClaseAdminDto from(ClaseGrabada c, long vistas, long favoritas) {
        return new ClaseAdminDto(c.getId(), c.getTitulo(), c.getDescripcion(), c.getNivel().getId(), c.getNivel().getNombre(),
                c.getNivel().getCodigo(), c.getDuracionMinutos(), c.getFechaClase(), c.getUrlVideo(), c.getUrlPizarra(),
                c.isPublicada(), vistas, favoritas);
    }
}
