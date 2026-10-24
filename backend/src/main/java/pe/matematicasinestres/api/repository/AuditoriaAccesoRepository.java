package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.AuditoriaAcceso;
import pe.matematicasinestres.api.entity.EventoAuditoria;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditoriaAccesoRepository extends JpaRepository<AuditoriaAcceso, Long> {

    List<AuditoriaAcceso> findTop100ByOrderByCreadoEnDesc();

    long countByEventoAndCreadoEnAfter(EventoAuditoria evento, LocalDateTime desde);
}
