package pe.matematicasinestres.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.matematicasinestres.api.entity.Horario;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
    List<Horario> findAllByOrderByHoraInicioAsc();
}
