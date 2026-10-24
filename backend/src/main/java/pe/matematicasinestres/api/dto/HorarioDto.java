package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.Horario;

import java.time.format.DateTimeFormatter;

public record HorarioDto(Long id, String turno, String horaInicio, String horaFin, String dias) {

    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    public static HorarioDto from(Horario h) {
        return new HorarioDto(h.getId(), h.getTurno(), h.getHoraInicio().format(HH_MM),
                h.getHoraFin().format(HH_MM), h.getDias());
    }
}
