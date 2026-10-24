package pe.matematicasinestres.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.repository.MatriculaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Vence automáticamente las matrículas ACTIVAS cuya fecha de fin ya pasó.
 * Se ejecuta al arrancar la aplicación y todos los días a las 00:05 (hora de Lima).
 */
@Service
public class VencimientoMatriculasService {

    private static final Logger log = LoggerFactory.getLogger(VencimientoMatriculasService.class);

    private final MatriculaRepository matriculas;
    private final TransactionTemplate transaccion;

    public VencimientoMatriculasService(MatriculaRepository matriculas, PlatformTransactionManager transactionManager) {
        this.matriculas = matriculas;
        this.transaccion = new TransactionTemplate(transactionManager);
    }

    /** Devuelve cuántas matrículas pasaron a VENCIDA. */
    public int vencerMatriculasExpiradas() {
        Integer cambiadas = transaccion.execute(status -> matriculas.vencerMatriculas(
                EstadoMatricula.ACTIVA, EstadoMatricula.VENCIDA, LocalDate.now(), LocalDateTime.now()));
        int total = cambiadas == null ? 0 : cambiadas;
        if (total > 0) {
            log.info("Se vencieron {} matrícula(s) con fecha de fin pasada.", total);
        }
        return total;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "America/Lima")
    public void tareaDiaria() {
        vencerMatriculasExpiradas();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void alIniciar() {
        vencerMatriculasExpiradas();
    }
}
