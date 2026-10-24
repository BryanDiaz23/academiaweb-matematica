package pe.matematicasinestres.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.*;
import pe.matematicasinestres.api.entity.SolicitudInformacion;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.ClaseGrabadaRepository;
import pe.matematicasinestres.api.repository.HorarioRepository;
import pe.matematicasinestres.api.repository.NivelRepository;
import pe.matematicasinestres.api.repository.SolicitudInformacionRepository;

import java.util.List;

/** Información pública de la academia (niveles, horarios, clases recientes, solicitudes). */
@Service
public class CatalogoService {

    private final NivelRepository niveles;
    private final HorarioRepository horarios;
    private final ClaseGrabadaRepository clases;
    private final SolicitudInformacionRepository solicitudes;

    public CatalogoService(NivelRepository niveles, HorarioRepository horarios, ClaseGrabadaRepository clases,
                           SolicitudInformacionRepository solicitudes) {
        this.niveles = niveles;
        this.horarios = horarios;
        this.clases = clases;
        this.solicitudes = solicitudes;
    }

    @Transactional(readOnly = true)
    public List<NivelDto> niveles() {
        return niveles.findByActivoTrueOrderByOrdenAsc().stream().map(NivelDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<HorarioDto> horarios() {
        return horarios.findAllByOrderByHoraInicioAsc().stream().map(HorarioDto::from).toList();
    }

    @Transactional(readOnly = true)
    public EstadisticasDto estadisticas() {
        return new EstadisticasDto(niveles.findByActivoTrueOrderByOrdenAsc().size(), horarios.count(), clases.countByPublicadaTrue());
    }

    @Transactional(readOnly = true)
    public List<ClaseResumenDto> clasesRecientes() {
        return clases.findTop3ByPublicadaTrueOrderByFechaClaseDesc().stream().map(ClaseResumenDto::from).toList();
    }

    @Transactional
    public MensajeResponse registrarSolicitud(SolicitudRequest req) {
        SolicitudInformacion s = new SolicitudInformacion();
        s.setNombre(req.nombre().trim());
        s.setTelefono(req.telefono().trim());
        s.setEmail(req.email() == null || req.email().isBlank() ? null : req.email().trim().toLowerCase());
        s.setMensaje(req.mensaje() == null || req.mensaje().isBlank() ? null : req.mensaje().trim());
        if (req.nivelId() != null) {
            s.setNivel(niveles.findById(req.nivelId()).orElseThrow(() -> ApiException.noEncontrado("Nivel")));
        }
        solicitudes.save(s);
        return new MensajeResponse("¡Gracias! Te contactaremos por WhatsApp para coordinar tu clase de diagnóstico.");
    }
}
