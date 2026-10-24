package pe.matematicasinestres.api.web;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.matematicasinestres.api.dto.AvanceAlumnoDto;
import pe.matematicasinestres.api.dto.HijoResumenDto;
import pe.matematicasinestres.api.security.UsuarioPrincipal;
import pe.matematicasinestres.api.service.ApoderadoService;

import java.util.List;

/** Portal de padres y apoderados. Doble barrera: regla por URL (SecurityConfig) y @PreAuthorize. */
@RestController
@RequestMapping("/api/apoderado")
@PreAuthorize("hasRole('APODERADO')")
public class ApoderadoController {

    private final ApoderadoService servicio;

    public ApoderadoController(ApoderadoService servicio) {
        this.servicio = servicio;
    }

    /** Hijos vinculados a mi cuenta, con un resumen de avance. Lista vacía si aún no hay vínculos. */
    @GetMapping("/hijos")
    public List<HijoResumenDto> misHijos(@AuthenticationPrincipal UsuarioPrincipal yo) {
        return servicio.misHijos(yo.getId());
    }

    /** 200 informe | 403 si el alumno no está vinculado a esta cuenta (o no existe) */
    @GetMapping("/hijos/{alumnoId}/avance")
    public AvanceAlumnoDto avance(@AuthenticationPrincipal UsuarioPrincipal yo, @PathVariable("alumnoId") Long alumnoId) {
        return servicio.avance(yo.getId(), alumnoId);
    }
}
