package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.AuditoriaAcceso;

import java.time.LocalDateTime;

public record AuditoriaDto(Long id, String usuario, String identificador, String evento, String detalle, String ip,
                           LocalDateTime creadoEn) {

    public static AuditoriaDto from(AuditoriaAcceso a) {
        return new AuditoriaDto(a.getId(), a.getUsuario() != null ? a.getUsuario().getUsername() : null,
                a.getIdentificador(), a.getEvento().name(), a.getDetalle(), a.getIp(), a.getCreadoEn());
    }
}
