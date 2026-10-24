package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.matematicasinestres.api.entity.ClaseGrabada;
import pe.matematicasinestres.api.entity.EstadoMatricula;

import java.time.LocalDate;
import java.util.List;

public interface ClaseGrabadaRepository extends JpaRepository<ClaseGrabada, Long> {

    List<ClaseGrabada> findTop3ByPublicadaTrueOrderByFechaClaseDesc();

    List<ClaseGrabada> findAllByOrderByFechaClaseDesc();

    long countByPublicadaTrue();

    /**
     * Clases publicadas de los niveles en los que el alumno tiene una matrícula ACTIVA y vigente,
     * con búsqueda por texto (cadena vacía = todas). Consulta JPQL con parámetros nombrados
     * (:usuarioId, :estado, :texto): el motor los envía como parámetros enlazados,
     * nunca como texto concatenado, lo que neutraliza la inyección SQL.
     */
    @Query("""
            SELECT c FROM ClaseGrabada c
            WHERE c.publicada = true
              AND c.nivel.id IN (
                  SELECT m.nivel.id FROM Matricula m
                  WHERE m.usuario.id = :usuarioId AND m.estado = :estado
                    AND (m.fechaFin IS NULL OR m.fechaFin >= :hoy))
              AND (LOWER(c.titulo) LIKE LOWER(CONCAT('%', :texto, '%'))
                   OR LOWER(c.descripcion) LIKE LOWER(CONCAT('%', :texto, '%')))
            ORDER BY c.fechaClase DESC
            """)
    List<ClaseGrabada> buscarParaAlumno(@Param("usuarioId") Long usuarioId,
                                        @Param("estado") EstadoMatricula estado,
                                        @Param("texto") String texto,
                                        @Param("hoy") LocalDate hoy);
}
