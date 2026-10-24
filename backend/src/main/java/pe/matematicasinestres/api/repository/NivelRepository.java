package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.Nivel;

import java.util.List;
import java.util.Optional;

public interface NivelRepository extends JpaRepository<Nivel, Long> {
    List<Nivel> findByActivoTrueOrderByOrdenAsc();

    Optional<Nivel> findByCodigo(String codigo);
}
