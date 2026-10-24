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
import pe.matematicasinestres.api.security.PasswordPolicy;
import pe.matematicasinestres.api.service.VencimientoMatriculasService;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Pruebas de las mejoras: vencimiento de matrículas, contraseña temporal y estadísticas públicas. */
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class MejorasIntegrationTest {

    private static final String PASS = "Kx#72mVq!Lp9wZ";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired RolRepository roles;
    @Autowired NivelRepository niveles;
    @Autowired HorarioRepository horarios;
    @Autowired MatriculaRepository matriculas;
    @Autowired ClaseGrabadaRepository clases;
    @Autowired PasswordEncoder encoder;
    @Autowired PasswordPolicy politica;
    @Autowired VencimientoMatriculasService vencimiento;

    private String sufijo;

    @BeforeEach
    void setUp() {
        sufijo = UUID.randomUUID().toString().substring(0, 8);
    }

    private Usuario crearUsuario(String username, String rol) {
        Usuario u = new Usuario();
        u.setNombreCompleto("Usuario Prueba");
        u.setUsername(username);
        u.setEmail(username + "@test.pe");
        u.setPasswordHash(encoder.encode(PASS));
        u.setRol(roles.findByNombre(rol).orElseThrow());
        return usuarios.save(u);
    }

    private Matricula matricular(Usuario u, String codigoNivel, LocalDate inicio, LocalDate fin) {
        Matricula m = new Matricula();
        m.setUsuario(u);
        m.setNivel(niveles.findByCodigo(codigoNivel).orElseThrow());
        m.setHorario(horarios.findAll().get(0));
        m.setEstado(EstadoMatricula.ACTIVA);
        m.setFechaInicio(inicio);
        m.setFechaFin(fin);
        return matriculas.save(m);
    }

    private String login(String usuario, String password) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    private Long idClaseDeNivel(String codigoNivel) {
        return clases.findAll().stream().filter(c -> c.getNivel().getCodigo().equals(codigoNivel))
                .findFirst().orElseThrow().getId();
    }

    // ------------------------------------------------------------------ vencimiento

    @Test
    @DisplayName("VEN-01 Matrícula ACTIVA con fecha de fin pasada no da acceso a las clases")
    void matriculaVencidaSinAcceso() throws Exception {
        Usuario alumno = crearUsuario("vencido." + sufijo, Rol.ALUMNO);
        matricular(alumno, "SECUNDARIA", LocalDate.now().minusMonths(2), LocalDate.now().minusDays(1));
        String token = login(alumno.getUsername(), PASS);
        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/alumno/clases/" + idClaseDeNivel("SECUNDARIA")).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("VEN-02 La tarea de vencimiento pasa a VENCIDA las matrículas expiradas y respeta las vigentes")
    void tareaDeVencimiento() {
        Usuario a = crearUsuario("tarea." + sufijo, Rol.ALUMNO);
        Matricula expirada = matricular(a, "PRIMARIA", LocalDate.now().minusMonths(1).minusDays(2), LocalDate.now().minusDays(2));
        Matricula vigente = matricular(a, "PRE", LocalDate.now(), LocalDate.now().plusMonths(1));
        assertThat(vencimiento.vencerMatriculasExpiradas()).isGreaterThanOrEqualTo(1);
        assertThat(matriculas.findById(expirada.getId()).orElseThrow().getEstado()).isEqualTo(EstadoMatricula.VENCIDA);
        assertThat(matriculas.findById(vigente.getId()).orElseThrow().getEstado()).isEqualTo(EstadoMatricula.ACTIVA);
    }

    @Test
    @DisplayName("VEN-03 Reactivar una matrícula vencida la renueva por un mes desde hoy")
    void renovarMatriculaVencida() throws Exception {
        String admin = "adm.ven." + sufijo;
        crearUsuario(admin, Rol.ADMIN);
        String token = login(admin, PASS);
        Usuario a = crearUsuario("renueva." + sufijo, Rol.ALUMNO);
        Matricula m = matricular(a, "PRIMARIA", LocalDate.now().minusMonths(2), LocalDate.now().minusMonths(1));
        m.setEstado(EstadoMatricula.VENCIDA);
        matriculas.save(m);
        mvc.perform(patch("/api/admin/matriculas/" + m.getId()).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"estado\":\"ACTIVA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("ACTIVA"))
                .andExpect(jsonPath("$.fechaInicio").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.fechaFin").value(LocalDate.now().plusMonths(1).toString()));
    }

    // ------------------------------------------------------------------ contraseña temporal

    @Test
    @DisplayName("PWD-01 El administrador restablece la contraseña y el usuario debe cambiarla antes de continuar")
    void restablecerYCambioObligatorio() throws Exception {
        String admin = "adm.pwd." + sufijo;
        crearUsuario(admin, Rol.ADMIN);
        String tokenAdmin = login(admin, PASS);
        Usuario alumno = crearUsuario("olvido." + sufijo, Rol.ALUMNO);
        matricular(alumno, "SECUNDARIA", LocalDate.now(), LocalDate.now().plusMonths(1));

        MvcResult r = mvc.perform(patch("/api/admin/usuarios/" + alumno.getId() + "/restablecer-password")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(alumno.getUsername()))
                .andReturn();
        String temporal = JsonPath.read(r.getResponse().getContentAsString(), "$.passwordTemporal");
        assertThat(politica.validar(temporal, alumno.getNombreCompleto(), alumno.getUsername(), alumno.getEmail())).isEmpty();

        // la contraseña anterior ya no sirve
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + alumno.getUsername() + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isUnauthorized());

        // con la temporal inicia sesión, pero queda marcado para cambiarla
        MvcResult lr = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + alumno.getUsername() + "\",\"password\":\"" + temporal + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.debeCambiarPassword").value(true))
                .andReturn();
        String token = JsonPath.read(lr.getResponse().getContentAsString(), "$.token");

        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("CAMBIO_PASSWORD_REQUERIDO"));
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        String nueva = "Zt8#qWm4!vRn2Px";
        mvc.perform(put("/api/auth/password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"passwordActual\":\"" + temporal + "\",\"passwordNueva\":\"" + nueva + "\",\"confirmarPassword\":\"" + nueva + "\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));
        assertThat(usuarios.findById(alumno.getId()).orElseThrow().isDebeCambiarPassword()).isFalse();
    }

    @Test
    @DisplayName("PWD-02 Un alumno no puede restablecer contraseñas (403) y el admin no puede usarlo sobre sí mismo (400)")
    void restablecerControlDeAcceso() throws Exception {
        Usuario alumno = crearUsuario("intruso.pwd." + sufijo, Rol.ALUMNO);
        String tokenAlumno = login(alumno.getUsername(), PASS);
        mvc.perform(patch("/api/admin/usuarios/" + alumno.getId() + "/restablecer-password").header("Authorization", "Bearer " + tokenAlumno))
                .andExpect(status().isForbidden());
        Usuario admin = crearUsuario("adm.self." + sufijo, Rol.ADMIN);
        String tokenAdmin = login(admin.getUsername(), PASS);
        mvc.perform(patch("/api/admin/usuarios/" + admin.getId() + "/restablecer-password").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------------ estadísticas

    @Test
    @DisplayName("EST-01 Las estadísticas públicas salen de la base de datos")
    void estadisticasPublicas() throws Exception {
        mvc.perform(get("/api/public/estadisticas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.niveles").value(3))
                .andExpect(jsonPath("$.turnos").value(3))
                .andExpect(jsonPath("$.clasesPublicadas", greaterThanOrEqualTo(6)));
    }
}
