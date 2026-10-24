package pe.matematicasinestres.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Límite de peticiones por IP: con un máximo de 3 por minuto, el cuarto intento recibe 429. */
@SpringBootTest(properties = {"app.rate-limit.enabled=true", "app.rate-limit.login-por-minuto=3"})
@AutoConfigureMockMvc
class RateLimitIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    @DisplayName("RL-01 Más de 3 intentos de login por minuto desde la misma IP devuelven 429")
    void limiteDeLogin() throws Exception {
        String cuerpo = "{\"usuario\":\"no.existe.rl\",\"password\":\"Cualquiera#2026x\"}";
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429));
    }
}
