package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.SolicitudInformacion;

import java.time.LocalDateTime;

public record SolicitudDto(Long id, String nombre, String telefono, String email, String nivel, String mensaje,
                           boolean atendida, LocalDateTime creadoEn) {

    public static SolicitudDto from(SolicitudInformacion s) {
        return new SolicitudDto(s.getId(), s.getNombre(), s.getTelefono(), s.getEmail(),
                s.getNivel() != null ? s.getNivel().getNombre() : null, s.getMensaje(), s.isAtendida(), s.getCreadoEn());
    }
}
