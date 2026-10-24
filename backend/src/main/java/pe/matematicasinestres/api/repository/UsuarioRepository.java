package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.Usuario;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA. Todas las consultas son derivadas o parametrizadas:
 * Hibernate genera PreparedStatements, por lo que la entrada del usuario
 * nunca se concatena en el SQL (mitigación de inyección SQL).
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsernameIgnoreCase(String username);

    Optional<Usuario> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    long countByRolNombre(String rolNombre);

    List<Usuario> findAllByOrderByCreadoEnDesc();
}
