package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.SolicitudInformacion;

import java.util.List;

public interface SolicitudInformacionRepository extends JpaRepository<SolicitudInformacion, Long> {

    List<SolicitudInformacion> findAllByOrderByCreadoEnDesc();

    long countByAtendidaFalse();
}
