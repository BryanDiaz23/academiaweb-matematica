package pe.matematicasinestres.api.web;

import jakarta.validation.Valid;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pe.matematicasinestres.api.dto.*;
import pe.matematicasinestres.api.service.CatalogoService;
import pe.matematicasinestres.api.service.MesaAyudaService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Endpoints públicos (no requieren token). No exponen enlaces de clases ni datos personales. */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final CatalogoService catalogo;
    private final MesaAyudaService mesaAyuda;
    private final String version;
    private final String construidoEn;
    private final String commit;

    public PublicController(CatalogoService catalogo, MesaAyudaService mesaAyuda, ObjectProvider<BuildProperties> build,
                            @Value("${app.commit:}") String commit) {
        this.catalogo = catalogo;
        this.mesaAyuda = mesaAyuda;
        BuildProperties info = build.getIfAvailable();
        this.version = info != null ? info.getVersion() : "desarrollo";
        this.construidoEn = info != null && info.getTime() != null
                ? info.getTime().atZone(ZoneId.of("America/Lima")).toLocalDateTime().toString() : null;
        this.commit = commit == null || commit.isBlank() ? null : commit.substring(0, Math.min(7, commit.length()));
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("estado", "UP", "servicio", "matematica-sin-estres-api", "version", version,
                "hora", LocalDateTime.now().toString());
    }

    /** Versión desplegada: permite validar, después de cada cambio, que en producción corre la release esperada. */
    @GetMapping("/version")
    public Map<String, Object> version() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("servicio", "matematica-sin-estres-api");
        r.put("version", version);
        if (commit != null) r.put("commit", commit);
        if (construidoEn != null) r.put("construidoEn", construidoEn);
        return r;
    }

    /** Catálogo de servicios de la mesa de ayuda: tipos de solicitud, prioridad y tiempo de atención. */
    @GetMapping("/catalogo-servicios")
    public List<CatalogoServicioDto> catalogoServicios() {
        return mesaAyuda.catalogo();
    }

    @GetMapping("/niveles")
    public List<NivelDto> niveles() {
        return catalogo.niveles();
    }

    @GetMapping("/horarios")
    public List<HorarioDto> horarios() {
        return catalogo.horarios();
    }

    @GetMapping("/estadisticas")
    public EstadisticasDto estadisticas() {
        return catalogo.estadisticas();
    }

    @GetMapping("/clases-recientes")
    public List<ClaseResumenDto> clasesRecientes() {
        return catalogo.clasesRecientes();
    }

    @PostMapping("/solicitudes")
    @ResponseStatus(HttpStatus.CREATED)
    public MensajeResponse solicitar(@Valid @RequestBody SolicitudRequest req) {
        return catalogo.registrarSolicitud(req);
    }
}
