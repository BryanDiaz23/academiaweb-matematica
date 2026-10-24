package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.matematicasinestres.api.entity.ProgresoClase;

import java.util.List;
import java.util.Optional;

public interface ProgresoClaseRepository extends JpaRepository<ProgresoClase, Long> {

    @Query("SELECT p FROM ProgresoClase p WHERE p.usuario.id = :usuarioId")
    List<ProgresoClase> findByUsuario(@Param("usuarioId") Long usuarioId);

    @Query("SELECT p FROM ProgresoClase p WHERE p.usuario.id = :usuarioId AND p.clase.id = :claseId")
    Optional<ProgresoClase> findByUsuarioYClase(@Param("usuarioId") Long usuarioId, @Param("claseId") Long claseId);

    /** Cantidad de alumnos que marcaron cada clase como vista: filas [claseId, total]. */
    @Query("SELECT p.clase.id, COUNT(p) FROM ProgresoClase p WHERE p.vista = true GROUP BY p.clase.id")
    List<Object[]> contarVistasPorClase();

    /** Cantidad de alumnos que guardaron cada clase como favorita: filas [claseId, total]. */
    @Query("SELECT p.clase.id, COUNT(p) FROM ProgresoClase p WHERE p.favorita = true GROUP BY p.clase.id")
    List<Object[]> contarFavoritasPorClase();
}
