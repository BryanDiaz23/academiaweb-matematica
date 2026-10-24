package pe.matematicasinestres.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada del back-end de la academia virtual "Matemática Sin Estrés".
 */
@SpringBootApplication
@EnableScheduling
public class MatematicaSinEstresApplication {

    public static void main(String[] args) {
        SpringApplication.run(MatematicaSinEstresApplication.class, args);
    }
}
