package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.entity.Matricula;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {

    List<Matricula> findByUsuarioIdOrderByCreadoEnDesc(Long usuarioId);

    List<Matricula> findAllByOrderByCreadoEnDesc();

    boolean existsByUsuarioIdAndNivelIdAndEstado(Long usuarioId, Long nivelId, EstadoMatricula estado);

    boolean existsByUsuarioIdAndNivelIdAndEstadoIn(Long usuarioId, Long nivelId, Collection<EstadoMatricula> estados);

    long countByEstado(EstadoMatricula estado);

    /**
     * Matrícula vigente = estado ACTIVA y fecha de fin no vencida.
     * Así el acceso se corta el mismo día del vencimiento, aunque la tarea diaria aún no haya corrido.
     */
    @Query("""
            SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Matricula m
            WHERE m.usuario.id = :usuarioId AND m.nivel.id = :nivelId
              AND m.estado = :estado
              AND (m.fechaFin IS NULL OR m.fechaFin >= :hoy)
            """)
    boolean tieneMatriculaVigente(@Param("usuarioId") Long usuarioId,
                                  @Param("nivelId") Long nivelId,
                                  @Param("estado") EstadoMatricula estado,
                                  @Param("hoy") LocalDate hoy);

    /** Pasa a VENCIDA toda matrícula ACTIVA cuya fecha de fin ya pasó. Devuelve cuántas cambió. */
    @Modifying
    @Query("""
            UPDATE Matricula m SET m.estado = :vencida, m.actualizadoEn = :ahora
            WHERE m.estado = :activa AND m.fechaFin < :hoy
            """)
    int vencerMatriculas(@Param("activa") EstadoMatricula activa,
                         @Param("vencida") EstadoMatricula vencida,
                         @Param("hoy") LocalDate hoy,
                         @Param("ahora") LocalDateTime ahora);
}
