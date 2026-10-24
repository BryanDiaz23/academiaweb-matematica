package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.VinculoApoderado;

import java.time.LocalDateTime;

public record VinculoDto(
        Long id,
        Long apoderadoId,
        String apoderado,
        String apoderadoUsername,
        Long alumnoId,
        String alumno,
        String alumnoUsername,
        String parentesco,
        LocalDateTime creadoEn
) {
    public static VinculoDto from(VinculoApoderado v) {
        return new VinculoDto(v.getId(), v.getApoderado().getId(), v.getApoderado().getNombreCompleto(),
                v.getApoderado().getUsername(), v.getAlumno().getId(), v.getAlumno().getNombreCompleto(),
                v.getAlumno().getUsername(), v.getParentesco().name(), v.getCreadoEn());
    }
}
