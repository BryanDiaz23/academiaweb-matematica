package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.ClaseGrabada;

import java.time.LocalDate;

public record ClaseDto(
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
        boolean publicada
) {
    public static ClaseDto from(ClaseGrabada c) {
        return new ClaseDto(c.getId(), c.getTitulo(), c.getDescripcion(), c.getNivel().getId(), c.getNivel().getNombre(),
                c.getNivel().getCodigo(), c.getDuracionMinutos(), c.getFechaClase(), c.getUrlVideo(), c.getUrlPizarra(),
                c.isPublicada());
    }
}
