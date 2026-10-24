package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.ClaseGrabada;

import java.time.LocalDate;

/** Vista pública de una clase: SIN enlaces de descarga (solo para alumnos matriculados). */
public record ClaseResumenDto(Long id, String titulo, String nivel, String nivelCodigo, int duracionMinutos, LocalDate fechaClase) {

    public static ClaseResumenDto from(ClaseGrabada c) {
        return new ClaseResumenDto(c.getId(), c.getTitulo(), c.getNivel().getNombre(), c.getNivel().getCodigo(),
                c.getDuracionMinutos(), c.getFechaClase());
    }
}
