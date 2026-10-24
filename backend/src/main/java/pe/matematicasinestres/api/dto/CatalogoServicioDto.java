package pe.matematicasinestres.api.dto;

import pe.matematicasinestres.api.entity.TipoSolicitud;

import java.util.List;

/** Entrada del catálogo de servicios: qué se puede pedir, quién y en cuánto tiempo se atiende. */
public record CatalogoServicioDto(String tipo, String nombre, String descripcion, String prioridad, int horasSla,
                                  List<String> roles) {

    public static CatalogoServicioDto from(TipoSolicitud t) {
        return new CatalogoServicioDto(t.name(), t.getNombre(), t.getDescripcion(), t.getPrioridad().name(),
                t.getHorasSla(), t.getRoles().stream().sorted().toList());
    }
}
