package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.ProgresoClase;

import java.time.LocalDateTime;

public record ProgresoDto(Long claseId, boolean vista, boolean favorita, LocalDateTime ultimaVez) {

    public static ProgresoDto from(Long claseId, ProgresoClase p) {
        return new ProgresoDto(claseId, p.isVista(), p.isFavorita(), p.getUltimaVez());
    }
}
