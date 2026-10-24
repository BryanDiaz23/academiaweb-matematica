package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.VinculoApoderado;

import java.util.List;
import java.util.Optional;

public interface VinculoApoderadoRepository extends JpaRepository<VinculoApoderado, Long> {

    List<VinculoApoderado> findByApoderadoIdOrderByCreadoEnAsc(Long apoderadoId);

    Optional<VinculoApoderado> findByApoderadoIdAndAlumnoId(Long apoderadoId, Long alumnoId);

    boolean existsByApoderadoIdAndAlumnoId(Long apoderadoId, Long alumnoId);

    List<VinculoApoderado> findAllByOrderByCreadoEnDesc();
}
