package pe.matematicasinestres.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PRUEBAS DE HUMO (smoke tests): verifican en pocos segundos que la funcionalidad principal
 * está viva antes de ejecutar pruebas más exhaustivas. Si alguna falla, no se avanza con el resto.
 * Ejecución aislada: {@code mvn test -Dgroups=humo}
 */
@Tag("humo")
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class PruebasHumoIntegrationTest {

    @Autowired MockMvc mvc;

    @ParameterizedTest(name = "HUM-01 GET {0} responde 200 con JSON")
    @ValueSource(strings = {
            "/api/public/health",
            "/api/public/niveles",
            "/api/public/horarios",
            "/api/public/estadisticas",
            "/api/public/clases-recientes"
    })
    void endpointsPublicosResponden(String ruta) throws Exception {
        mvc.perform(get(ruta))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @ParameterizedTest(name = "HUM-02 GET {0} sin token responde 401")
    @ValueSource(strings = {
            "/api/auth/me",
            "/api/alumno/clases",
            "/api/alumno/matriculas",
            "/api/admin/resumen",
            "/api/admin/usuarios"
    })
    void recursosProtegidosExigenToken(String ruta) throws Exception {
        mvc.perform(get(ruta)).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("HUM-03 El health check informa estado UP")
    void healthCheckUp() throws Exception {
        mvc.perform(get("/api/public/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("\"estado\":\"UP\"")));
    }

    @Test
    @DisplayName("HUM-04 Las respuestas incluyen la cabecera Permissions-Policy que deniega cámara, micrófono y geolocalización")
    void permissionsPolicy() throws Exception {
        mvc.perform(get("/api/public/niveles"))
                .andExpect(header().string("Permissions-Policy", containsString("camera=()")))
                .andExpect(header().string("Permissions-Policy", containsString("microphone=()")))
                .andExpect(header().string("Permissions-Policy", containsString("geolocation=()")));
    }
}
