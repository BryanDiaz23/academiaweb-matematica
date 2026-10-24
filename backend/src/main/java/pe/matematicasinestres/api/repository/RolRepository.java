package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.Rol;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol, Long> {
    Optional<Rol> findByNombre(String nombre);
}
