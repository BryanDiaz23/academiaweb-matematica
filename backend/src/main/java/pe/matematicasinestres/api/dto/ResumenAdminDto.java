package pe.matematicasinestres.api.dto;

public record ResumenAdminDto(
        long usuarios,
        long alumnos,
        long matriculasActivas,
        long matriculasPendientes,
        long clasesPublicadas,
        long solicitudesPendientes,
        long loginsFallidos24h
) {
}
