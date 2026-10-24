package pe.matematicasinestres.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PRUEBAS DE RENDIMIENTO (ISO/IEC 25010 · Eficiencia de desempeño):
 *  - RND-01 Comportamiento temporal: el percentil 95 del tiempo de respuesta de cada endpoint público es menor a 500 ms
 *           (el mismo SLA que verifica la colección de Postman).
 *  - RND-02 Carga: peticiones concurrentes sobre un endpoint público sin errores.
 *  - RND-03 Estrés: se aumenta la concurrencia por escalones para ver si aparecen errores 5xx.
 *
 * Se ejecutan en proceso (MockMvc + H2), por lo que miden la lógica de la API y no la red. Las pruebas de carga
 * contra el despliegue real se hacen con Postman Runner o k6 (ver docs/06-plan-de-pruebas.md).
 * Ejecución aislada: {@code mvn test -Dgroups=rendimiento}
 */
@Tag("rendimiento")
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class RendimientoIntegrationTest {

    private static final long PRESUPUESTO_MS = 500;

    @Autowired MockMvc mvc;

    @ParameterizedTest(name = "RND-01 {0}: percentil 95 menor a 500 ms")
    @ValueSource(strings = {
            "/api/public/health",
            "/api/public/niveles",
            "/api/public/horarios",
            "/api/public/estadisticas",
            "/api/public/clases-recientes"
    })
    void tiempoDeRespuestaP95(String ruta) throws Exception {
        for (int i = 0; i < 5; i++) { // calentamiento: la primera llamada inicializa Hibernate y el caché de JIT
            mvc.perform(get(ruta)).andExpect(status().isOk());
        }
        long[] tiemposMs = new long[30];
        for (int i = 0; i < tiemposMs.length; i++) {
            long inicio = System.nanoTime();
            mvc.perform(get(ruta)).andExpect(status().isOk());
            tiemposMs[i] = (System.nanoTime() - inicio) / 1_000_000;
        }
        Arrays.sort(tiemposMs);
        long p95 = tiemposMs[(int) Math.ceil(0.95 * tiemposMs.length) - 1];
        System.out.printf("[RND-01] %s -> mediana=%d ms, p95=%d ms, max=%d ms%n",
                ruta, tiemposMs[tiemposMs.length / 2], p95, tiemposMs[tiemposMs.length - 1]);
        assertThat(p95).as("p95 de %s", ruta).isLessThan(PRESUPUESTO_MS);
    }

    @Test
    @DisplayName("RND-02 Carga: 300 peticiones concurrentes (20 hilos) a /api/public/niveles terminan todas en 200")
    void cargaConcurrente() throws Exception {
        Resultado r = ejecutar("/api/public/niveles", 20, 15);
        System.out.printf("[RND-02] 20 hilos x 15 -> %d peticiones, %d ok, p95=%d ms, total=%d ms%n",
                r.total(), r.exitosas(), r.p95Ms(), r.duracionMs());
        assertThat(r.exitosas()).isEqualTo(r.total());
        assertThat(r.duracionMs()).as("duración total de la carga").isLessThan(20_000);
    }

    @Test
    @DisplayName("RND-03 Estrés: con 10, 40 y 80 hilos simultáneos la API no devuelve errores 5xx")
    void estresEscalonado() throws Exception {
        for (int hilos : new int[]{10, 40, 80}) {
            Resultado r = ejecutar("/api/public/clases-recientes", hilos, 5);
            System.out.printf("[RND-03] %d hilos -> %d peticiones, %d ok, %d con error 5xx, p95=%d ms%n",
                    hilos, r.total(), r.exitosas(), r.errores5xx(), r.p95Ms());
            assertThat(r.errores5xx()).as("errores 5xx con %d hilos", hilos).isZero();
            assertThat(r.exitosas()).as("respuestas 200 con %d hilos", hilos).isEqualTo(r.total());
        }
    }

    // ------------------------------------------------------------------ utilidades

    private record Resultado(int total, int exitosas, int errores5xx, long p95Ms, long duracionMs) { }

    private Resultado ejecutar(String ruta, int hilos, int peticionesPorHilo) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(hilos);
        try {
            List<Future<long[]>> futuros = new ArrayList<>();
            long inicioGlobal = System.nanoTime();
            for (int i = 0; i < hilos * peticionesPorHilo; i++) {
                Callable<long[]> tarea = () -> {
                    long inicio = System.nanoTime();
                    int codigo = mvc.perform(get(ruta)).andReturn().getResponse().getStatus();
                    return new long[]{codigo, (System.nanoTime() - inicio) / 1_000_000};
                };
                futuros.add(pool.submit(tarea));
            }
            int exitosas = 0;
            int errores5xx = 0;
            long[] tiempos = new long[futuros.size()];
            for (int i = 0; i < futuros.size(); i++) {
                long[] r = futuros.get(i).get(60, TimeUnit.SECONDS);
                if (r[0] == 200) {
                    exitosas++;
                }
                if (r[0] >= 500) {
                    errores5xx++;
                }
                tiempos[i] = r[1];
            }
            long duracion = (System.nanoTime() - inicioGlobal) / 1_000_000;
            Arrays.sort(tiempos);
            long p95 = tiempos[(int) Math.ceil(0.95 * tiempos.length) - 1];
            return new Resultado(futuros.size(), exitosas, errores5xx, p95, duracion);
        } finally {
            pool.shutdownNow();
        }
    }
}
