package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.EstadoSolicitud;
import pe.matematicasinestres.api.entity.SolicitudServicio;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SolicitudServicioRepository extends JpaRepository<SolicitudServicio, Long> {

    List<SolicitudServicio> findBySolicitanteIdOrderByCreadoEnDesc(Long solicitanteId);

    Optional<SolicitudServicio> findByIdAndSolicitanteId(Long id, Long solicitanteId);

    long countBySolicitanteIdAndEstadoIn(Long solicitanteId, Collection<EstadoSolicitud> estados);

    List<SolicitudServicio> findAllByOrderByCreadoEnDesc();
}
