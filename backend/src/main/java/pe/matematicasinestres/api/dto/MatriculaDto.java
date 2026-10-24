package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.Matricula;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MatriculaDto(
        Long id,
        Long usuarioId,
        String alumno,
        String username,
        Long nivelId,
        String nivel,
        Long horarioId,
        String horario,
        String estado,
        LocalDate fechaInicio,
        LocalDate fechaFin,
        LocalDateTime creadoEn
) {
    public static MatriculaDto from(Matricula m) {
        HorarioDto h = HorarioDto.from(m.getHorario());
        return new MatriculaDto(m.getId(), m.getUsuario().getId(), m.getUsuario().getNombreCompleto(),
                m.getUsuario().getUsername(), m.getNivel().getId(), m.getNivel().getNombre(), h.id(),
                h.turno() + " (" + h.horaInicio() + " - " + h.horaFin() + ")", m.getEstado().name(),
                m.getFechaInicio(), m.getFechaFin(), m.getCreadoEn());
    }
}
