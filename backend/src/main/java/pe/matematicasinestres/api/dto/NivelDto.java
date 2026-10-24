package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.Nivel;
import pe.matematicasinestres.api.entity.NivelCaracteristica;

import java.math.BigDecimal;
import java.util.List;

public record NivelDto(
        Long id,
        String codigo,
        String nombre,
        String subtitulo,
        String rangoEdad,
        BigDecimal precioMensual,
        boolean destacado,
        List<String> caracteristicas
) {
    public static NivelDto from(Nivel n) {
        return new NivelDto(n.getId(), n.getCodigo(), n.getNombre(), n.getSubtitulo(), n.getRangoEdad(),
                n.getPrecioMensual(), n.isDestacado(),
                n.getCaracteristicas().stream().map(NivelCaracteristica::getDescripcion).toList());
    }
}
