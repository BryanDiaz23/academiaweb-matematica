package pe.matematicasinestres.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pe.matematicasinestres.api.repository.SolicitudInformacionRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;

import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * PRUEBAS DE SEGURIDAD ORIENTADAS A ATAQUES (semanas 13-14 del curso): lotes de cargas maliciosas
 * (inyección SQL, XSS, cuerpos mal formados, tipos de contenido y verbos inesperados) contra la API.
 * Complementan los casos puntuales SQLI-01/02 y XSS-01/02 de {@link SeguridadIntegrationTest}.
 * Ejecución aislada: {@code mvn test -Dgroups=seguridad}
 */
@Tag("seguridad")
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class SeguridadPayloadsIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UsuarioRepository usuarios;
    @Autowired SolicitudInformacionRepository solicitudes;

    static Stream<String> payloadsSql() {
        return Stream.of(
                "' OR '1'='1' --",
                "admin'--",
                "' OR 1=1#",
                "\" OR \"\"=\"",
                "'; DROP TABLE usuarios; --",
                "' UNION SELECT NULL, password_hash FROM usuarios --",
                "1; SELECT pg_sleep(5)--",
                "bryandiaz' AND '1'='1"
        );
    }

    static Stream<String> payloadsXss() {
        return Stream.of(
                "<script>alert(1)</script>",
                "<img src=x onerror=alert(1)>",
                "\"><svg/onload=alert(1)>",
                "<iframe src=javascript:alert(1)>",
                "javascript:alert(document.cookie)",
                "Juan onmouseover=alert(1)",
                "data:text/html,<b>x</b>"
        );
    }

    // ------------------------------------------------------------------ inyección SQL

    @ParameterizedTest(name = "SEC-01 Inyección SQL en el login: [{0}] → 401")
    @MethodSource("payloadsSql")
    void inyeccionSqlEnLogin(String payload) throws Exception {
        String cuerpo = json.writeValueAsString(Map.of("usuario", payload, "password", "Cualquiera#2026x"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.token").doesNotExist());
        assertThat(usuarios.findByUsernameIgnoreCase("bryandiaz")).as("la tabla usuarios sigue intacta").isPresent();
    }

    @Test
    @DisplayName("SEC-02 Un texto con sentencias SQL se guarda como texto inofensivo (201) y no altera la base de datos")
    void sqlComoTextoLibre() throws Exception {
        long antes = solicitudes.count();
        String cuerpo = json.writeValueAsString(Map.of(
                "nombre", "Pedro Huamán",
                "telefono", "987654321",
                "mensaje", "'; DROP TABLE usuarios; --"));
        mvc.perform(post("/api/public/solicitudes").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated());
        assertThat(solicitudes.count()).isEqualTo(antes + 1);
        assertThat(usuarios.count()).as("la tabla usuarios no fue eliminada").isGreaterThanOrEqualTo(1);
    }

    // ------------------------------------------------------------------ XSS

    @ParameterizedTest(name = "SEC-03 XSS en el formulario público: [{0}] → 400")
    @MethodSource("payloadsXss")
    void xssEnFormularioPublico(String payload) throws Exception {
        String cuerpo = json.writeValueAsString(Map.of("nombre", payload, "telefono", "987654321"));
        mvc.perform(post("/api/public/solicitudes").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("SEC-04 Un campo de texto excesivamente largo (5000 caracteres) es rechazado con 400")
    void campoExcesivamenteLargo() throws Exception {
        String cuerpo = json.writeValueAsString(Map.of("nombre", "A".repeat(5000), "telefono", "987654321"));
        mvc.perform(post("/api/public/solicitudes").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ peticiones mal formadas

    @Test
    @DisplayName("SEC-05 JSON mal formado devuelve 400 con mensaje genérico (sin detalles internos)")
    void jsonMalFormado() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"usuario\": "))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(not(containsString("Exception"))))
                .andExpect(content().string(not(containsString("org.springframework"))));
    }

    @Test
    @DisplayName("SEC-06 Content-Type no soportado devuelve 415 (y no un 500 por error interno)")
    void tipoDeContenidoNoSoportado() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.TEXT_PLAIN).content("usuario=bryandiaz&password=x"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.status").value(415));
    }

    @Test
    @DisplayName("SEC-07 Verbo HTTP no permitido en un recurso público devuelve 405")
    void verboNoPermitido() throws Exception {
        mvc.perform(delete("/api/public/niveles")).andExpect(status().isMethodNotAllowed());
    }

    // ------------------------------------------------------------------ autenticación manipulada

    @ParameterizedTest(name = "SEC-08 Cabecera Authorization manipulada [{0}] → 401")
    @MethodSource("cabecerasAuthorizationInvalidas")
    void autorizacionManipulada(String cabecera) throws Exception {
        mvc.perform(get("/api/auth/me").header("Authorization", cabecera))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(not(containsString("Exception"))));
    }

    static Stream<String> cabecerasAuthorizationInvalidas() {
        return Stream.of(
                "Bearer",
                "Bearer ",
                "Bearer abc.def.ghi",
                "Bearer null",
                "Basic YnJ5YW5kaWF6OnBhc3N3b3Jk",
                "Token eyJhbGciOiJIUzI1NiJ9.e30.x"
        );
    }
}
