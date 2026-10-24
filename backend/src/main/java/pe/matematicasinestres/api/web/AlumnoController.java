package pe.matematicasinestres.api.web;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.matematicasinestres.api.dto.ClaseAlumnoDto;
import pe.matematicasinestres.api.dto.MatriculaDto;
import pe.matematicasinestres.api.dto.MatriculaRequest;
import pe.matematicasinestres.api.dto.ProgresoDto;
import pe.matematicasinestres.api.dto.ProgresoRequest;
import pe.matematicasinestres.api.security.UsuarioPrincipal;
import pe.matematicasinestres.api.service.ClaseService;
import pe.matematicasinestres.api.service.MatriculaService;

import java.util.List;

/** Aula virtual del alumno. Requiere rol ALUMNO (ver SecurityConfig). */
@RestController
@RequestMapping("/api/alumno")
public class AlumnoController {

    private final MatriculaService matriculaService;
    private final ClaseService claseService;

    public AlumnoController(MatriculaService matriculaService, ClaseService claseService) {
        this.matriculaService = matriculaService;
        this.claseService = claseService;
    }

    @GetMapping("/matriculas")
    public List<MatriculaDto> misMatriculas(@AuthenticationPrincipal UsuarioPrincipal yo) {
        return matriculaService.misMatriculas(yo.getId());
    }

    @PostMapping("/matriculas")
    @ResponseStatus(HttpStatus.CREATED)
    public MatriculaDto solicitarMatricula(@AuthenticationPrincipal UsuarioPrincipal yo,
                                           @Valid @RequestBody MatriculaRequest req) {
        return matriculaService.solicitar(yo.getId(), req);
    }

    @GetMapping("/clases")
    public List<ClaseAlumnoDto> misClases(@AuthenticationPrincipal UsuarioPrincipal yo,
                                    @RequestParam(name = "buscar", required = false) String buscar) {
        return claseService.listarParaAlumno(yo.getId(), buscar);
    }

    /** 200 si está matriculado | 403 si no tiene matrícula activa en ese nivel | 404 si no existe */
    @GetMapping("/clases/{id}")
    public ClaseAlumnoDto detalleClase(@AuthenticationPrincipal UsuarioPrincipal yo, @PathVariable("id") Long id) {
        return claseService.detalleParaAlumno(yo.getId(), id);
    }

    /** Marca la clase como abierta (para "Continuar viendo"). 200 | 403 sin matrícula vigente | 404 */
    @PostMapping("/clases/{id}/abrir")
    public ProgresoDto abrirClase(@AuthenticationPrincipal UsuarioPrincipal yo, @PathVariable("id") Long id) {
        return claseService.registrarAcceso(yo.getId(), id);
    }

    /** Marca la clase como vista o favorita. 200 | 403 sin matrícula vigente | 404 */
    @PutMapping("/clases/{id}/progreso")
    public ProgresoDto actualizarProgreso(@AuthenticationPrincipal UsuarioPrincipal yo, @PathVariable("id") Long id,
                                          @RequestBody ProgresoRequest req) {
        return claseService.actualizarProgreso(yo.getId(), id, req);
    }
}
