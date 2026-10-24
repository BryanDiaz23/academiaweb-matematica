package pe.matematicasinestres.api;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import pe.matematicasinestres.api.entity.*;
import pe.matematicasinestres.api.repository.*;

import java.time.LocalDate;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración de extremo a extremo (MockMvc + H2 + Flyway) que respaldan
 * la matriz de pruebas del APF2: autenticación JWT, BCrypt, códigos HTTP y OWASP Top 10.
 */
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class SeguridadIntegrationTest {

    /** Contraseña de prueba que cumple la política (solo existe en el entorno de pruebas). */
    private static final String PASS = "Kx#72mVq!Lp9wZ";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired RolRepository roles;
    @Autowired NivelRepository niveles;
    @Autowired HorarioRepository horarios;
    @Autowired MatriculaRepository matriculas;
    @Autowired ClaseGrabadaRepository clases;
    @Autowired PasswordEncoder encoder;

    private String sufijo;

    @BeforeEach
    void setUp() {
        sufijo = UUID.randomUUID().toString().substring(0, 8);
    }

    // ------------------------------------------------------------------ utilidades

    private Usuario crearUsuario(String username, String rol) {
        Usuario u = new Usuario();
        u.setNombreCompleto("Usuario Prueba");
        u.setUsername(username);
        u.setEmail(username + "@test.pe");
        u.setPasswordHash(encoder.encode(PASS));
        u.setRol(roles.findByNombre(rol).orElseThrow());
        return usuarios.save(u);
    }

    private String login(String usuario, String password) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    private String tokenAdmin() throws Exception {
        String username = "admin." + sufijo;
        crearUsuario(username, Rol.ADMIN);
        return login(username, PASS);
    }

    private Usuario alumnoConMatriculaActiva(String codigoNivel) {
        Usuario u = crearUsuario("alumno." + sufijo, Rol.ALUMNO);
        Matricula m = new Matricula();
        m.setUsuario(u);
        m.setNivel(niveles.findByCodigo(codigoNivel).orElseThrow());
        m.setHorario(horarios.findAll().get(0));
        m.setEstado(EstadoMatricula.ACTIVA);
        m.setFechaInicio(LocalDate.now().minusDays(1));
        m.setFechaFin(LocalDate.now().plusMonths(1));
        matriculas.save(m);
        return u;
    }

    private Long idClaseDeNivel(String codigoNivel) {
        return clases.findAll().stream()
                .filter(c -> c.getNivel().getCodigo().equals(codigoNivel))
                .findFirst().orElseThrow().getId();
    }

    // ------------------------------------------------------------------ base de datos / seed

    @Test
    @DisplayName("BD-01 Seed: existe el administrador Bryan Díaz con contraseña almacenada como hash BCrypt")
    void seedAdministrador() {
        Usuario bryan = usuarios.findByUsernameIgnoreCase("bryandiaz").orElseThrow();
        assertThat(bryan.getRol().getNombre()).isEqualTo(Rol.ADMIN);
        assertThat(bryan.getPasswordHash()).startsWith("$2a$12$").hasSize(60);
    }

    @Test
    @DisplayName("BD-02 Catálogo público cargado desde la BD (3 niveles, 3 horarios)")
    void catalogoPublico() throws Exception {
        mvc.perform(get("/api/public/niveles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[1].codigo").value("SECUNDARIA"))
                .andExpect(jsonPath("$[1].caracteristicas", hasSize(4)));
        mvc.perform(get("/api/public/horarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].horaInicio").value("08:00"));
    }

    @Test
    @DisplayName("SEG-01 Las clases recientes públicas no exponen enlaces de descarga")
    void clasesRecientesSinEnlaces() throws Exception {
        mvc.perform(get("/api/public/clases-recientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].urlVideo").doesNotExist());
    }

    // ------------------------------------------------------------------ autenticación

    @Test
    @DisplayName("AUT-01 Login correcto devuelve 200 y un JWT")
    void loginCorrecto() throws Exception {
        crearUsuario("login." + sufijo, Rol.ALUMNO);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"login." + sufijo + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.token", not(emptyString())))
                .andExpect(jsonPath("$.usuario.rol").value("ALUMNO"))
                .andExpect(jsonPath("$.usuario.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("AUT-02 Contraseña incorrecta devuelve 401 con mensaje genérico")
    void loginIncorrecto() throws Exception {
        crearUsuario("malpass." + sufijo, Rol.ALUMNO);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"malpass." + sufijo + "\",\"password\":\"Otra#Clave99x\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Usuario o contraseña incorrectos."))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @DisplayName("AUT-03 Usuario inexistente devuelve el mismo 401 (no permite enumerar usuarios)")
    void loginUsuarioInexistente() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"no.existe." + sufijo + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Usuario o contraseña incorrectos."));
    }

    @Test
    @DisplayName("AUT-04 Cinco intentos fallidos bloquean la cuenta (423) aunque luego se use la clave correcta")
    void bloqueoPorFuerzaBruta() throws Exception {
        String username = "bruta." + sufijo;
        crearUsuario(username, Rol.ALUMNO);
        String malo = "{\"usuario\":\"" + username + "\",\"password\":\"Incorrecta#77x\"}";
        for (int i = 1; i <= 4; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(malo))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(malo))
                .andExpect(status().isLocked());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + username + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isLocked());
    }

    @Test
    @DisplayName("AUT-05 Login con cuerpo vacío devuelve 400")
    void loginSinDatos() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles", not(empty())));
    }

    // ------------------------------------------------------------------ registro y BCrypt

    @Test
    @DisplayName("CRED-01 Registro con contraseña débil devuelve 400 y la lista de reglas incumplidas")
    void registroContrasenaDebil() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Luis Rojas\",\"username\":\"lrojas" + sufijo + "\","
                                + "\"email\":\"lrojas" + sufijo + "@test.pe\",\"password\":\"123456\",\"confirmarPassword\":\"123456\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("La contraseña no cumple la política de seguridad."))
                .andExpect(jsonPath("$.detalles", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    @DisplayName("CRED-02 Registro con contraseña que contiene el nombre de usuario devuelve 400")
    void registroContrasenaConUsuario() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Luis Rojas\",\"username\":\"lrojas\","
                                + "\"email\":\"otro" + sufijo + "@test.pe\",\"password\":\"Lrojas#9kQ!mZ\",\"confirmarPassword\":\"Lrojas#9kQ!mZ\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles", hasItem("No puede contener tu nombre, usuario o correo.")));
    }

    @Test
    @DisplayName("CRED-03 Registro válido devuelve 201 y la contraseña se guarda como hash BCrypt")
    void registroValidoGuardaHash() throws Exception {
        String username = "nuevo" + sufijo;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"María López\",\"username\":\"" + username + "\","
                                + "\"email\":\"" + username + "@test.pe\",\"password\":\"" + PASS + "\",\"confirmarPassword\":\"" + PASS + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("ALUMNO"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
        Usuario guardado = usuarios.findByUsernameIgnoreCase(username).orElseThrow();
        assertThat(guardado.getPasswordHash()).startsWith("$2a$12$").isNotEqualTo(PASS);
        assertThat(encoder.matches(PASS, guardado.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("CRED-04 Registro con usuario duplicado devuelve 409")
    void registroDuplicado() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Copia Bryan\",\"username\":\"bryandiaz\","
                                + "\"email\":\"copia" + sufijo + "@test.pe\",\"password\":\"" + PASS + "\",\"confirmarPassword\":\"" + PASS + "\"}"))
                .andExpect(status().isConflict());
    }

    // ------------------------------------------------------------------ JWT

    @Test
    @DisplayName("JWT-01 Recurso protegido sin token devuelve 401")
    void sinToken() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/usuarios")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("JWT-02 Token alterado (firma inválida) devuelve 401")
    void tokenAlterado() throws Exception {
        String token = tokenAdmin();
        String alterado = token.substring(0, token.length() - 4) + (token.endsWith("AAAA") ? "BBBB" : "AAAA");
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + alterado))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Token inválido, alterado o expirado."));
    }

    @Test
    @DisplayName("JWT-03 Token sin firma (alg: none) es rechazado con 401")
    void tokenSinFirma() throws Exception {
        Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
        String header = b64.encodeToString("{\"alg\":\"none\"}".getBytes());
        String payload = b64.encodeToString("{\"sub\":\"bryandiaz\",\"rol\":\"ADMIN\",\"iss\":\"matematica-sin-estres\"}".getBytes());
        mvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + header + "." + payload + "."))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("JWT-04 Token válido permite consultar el perfil (200)")
    void tokenValido() throws Exception {
        String token = tokenAdmin();
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    // ------------------------------------------------------------------ Broken Access Control

    @Test
    @DisplayName("BAC-01 Un ALUMNO no puede acceder al panel de administración (403)")
    void alumnoNoEsAdmin() throws Exception {
        Usuario alumno = crearUsuario("intruso." + sufijo, Rol.ALUMNO);
        String token = login(alumno.getUsername(), PASS);
        mvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/admin/clases/1").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("BAC-02 El ADMIN sí accede al panel de administración (200)")
    void adminAccede() throws Exception {
        String token = tokenAdmin();
        mvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].username", hasItem("bryandiaz")))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("BAC-03 Alumno de Secundaria ve solo clases de su nivel y recibe 403 en clases de otro nivel")
    void accesoPorMatricula() throws Exception {
        Usuario alumno = alumnoConMatriculaActiva("SECUNDARIA");
        String token = login(alumno.getUsername(), PASS);
        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].nivelCodigo", everyItem(is("SECUNDARIA"))));
        mvc.perform(get("/api/alumno/clases/" + idClaseDeNivel("SECUNDARIA")).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.urlVideo", startsWith("https://")));
        mvc.perform(get("/api/alumno/clases/" + idClaseDeNivel("PRIMARIA")).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("HTTP-01 Clase inexistente devuelve 404 e id no numérico devuelve 400")
    void claseInexistente() throws Exception {
        Usuario alumno = alumnoConMatriculaActiva("PRE");
        String token = login(alumno.getUsername(), PASS);
        mvc.perform(get("/api/alumno/clases/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/alumno/clases/abc").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ Inyección SQL

    @Test
    @DisplayName("SQLI-01 Payload de inyección SQL en el login es tratado como texto (401)")
    void inyeccionSqlLogin() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"' OR '1'='1' --\",\"password\":\"' OR '1'='1' --\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SQLI-02 Payload de inyección SQL en la búsqueda no devuelve datos ajenos")
    void inyeccionSqlBusqueda() throws Exception {
        Usuario alumno = alumnoConMatriculaActiva("PRIMARIA");
        String token = login(alumno.getUsername(), PASS);
        mvc.perform(get("/api/alumno/clases").param("buscar", "' OR 1=1 --").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        // la tabla sigue intacta
        assertThat(clases.count()).isGreaterThanOrEqualTo(6);
    }

    // ------------------------------------------------------------------ XSS

    @Test
    @DisplayName("XSS-01 Formulario público rechaza etiquetas <script> (400)")
    void xssEnSolicitud() throws Exception {
        mvc.perform(post("/api/public/solicitudes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"<script>alert(1)</script>\",\"telefono\":\"987654321\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles", hasItem(containsString("nombre"))));
    }

    @Test
    @DisplayName("XSS-02 No se aceptan enlaces javascript: en las clases grabadas (400)")
    void xssEnUrl() throws Exception {
        String token = tokenAdmin();
        Long nivelId = niveles.findByCodigo("PRIMARIA").orElseThrow().getId();
        mvc.perform(post("/api/admin/clases").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Clase\",\"nivelId\":" + nivelId + ",\"duracionMinutos\":60,"
                                + "\"fechaClase\":\"2026-10-01\",\"urlVideo\":\"javascript:alert(document.cookie)\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("XSS-03 Solicitud válida se registra (201)")
    void solicitudValida() throws Exception {
        mvc.perform(post("/api/public/solicitudes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Pedro Huamán\",\"telefono\":\"987654321\",\"mensaje\":\"Quiero info de PRE\"}"))
                .andExpect(status().isCreated());
    }

    // ------------------------------------------------------------------ Encabezados

    @Test
    @DisplayName("SEG-02 Las respuestas incluyen encabezados de seguridad")
    void encabezadosSeguridad() throws Exception {
        mvc.perform(get("/api/public/niveles"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'none'")));
    }
}
