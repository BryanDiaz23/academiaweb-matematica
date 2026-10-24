package pe.matematicasinestres.api.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.matematicasinestres.api.dto.CatalogoServicioDto;
import pe.matematicasinestres.api.dto.SolicitudServicioDto;
import pe.matematicasinestres.api.dto.SolicitudServicioRequest;
import pe.matematicasinestres.api.security.UsuarioPrincipal;
import pe.matematicasinestres.api.service.MesaAyudaService;

import java.util.List;

/** Mesa de ayuda para alumnos y apoderados. Doble barrera: regla por URL (SecurityConfig) y @PreAuthorize. */
@RestController
@RequestMapping("/api/mesa-ayuda")
@PreAuthorize("hasAnyRole('ALUMNO', 'APODERADO')")
public class MesaAyudaController {

    private final MesaAyudaService servicio;

    public MesaAyudaController(MesaAyudaService servicio) {
        this.servicio = servicio;
    }

    /** Tipos de solicitud que puede registrar mi rol. */
    @GetMapping("/catalogo")
    public List<CatalogoServicioDto> catalogo(@AuthenticationPrincipal UsuarioPrincipal yo) {
        return servicio.catalogoPara(yo.getRol());
    }

    @GetMapping("/solicitudes")
    public List<SolicitudServicioDto> misSolicitudes(@AuthenticationPrincipal UsuarioPrincipal yo) {
        return servicio.misSolicitudes(yo.getId());
    }

    /** 201 creada | 400 datos o tipo no permitido | 409 demasiadas pendientes */
    @PostMapping("/solicitudes")
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitudServicioDto crear(@Valid @RequestBody SolicitudServicioRequest req, @AuthenticationPrincipal UsuarioPrincipal yo,
                                      HttpServletRequest http) {
        return servicio.crear(yo.getId(), req, http.getRemoteAddr());
    }

    /** 200 cerrada | 404 inexistente o ajena | 409 aún no resuelta */
    @PatchMapping("/solicitudes/{id}/cerrar")
    public SolicitudServicioDto cerrar(@PathVariable("id") Long id, @AuthenticationPrincipal UsuarioPrincipal yo) {
        return servicio.confirmarCierre(yo.getId(), id);
    }
}
