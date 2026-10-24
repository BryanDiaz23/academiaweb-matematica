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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Pruebas del progreso del alumno en las clases y del alta manual de matrículas por el administrador. */
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class ProgresoYAdminIntegrationTest {

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

    private Usuario crearUsuario(String username, String rol) {
        Usuario u = new Usuario();
        u.setNombreCompleto("Usuario Prueba");
        u.setUsername(username);
        u.setEmail(username + "@test.pe");
        u.setPasswordHash(encoder.encode(PASS));
        u.setRol(roles.findByNombre(rol).orElseThrow());
        return usuarios.save(u);
    }

    private void matricular(Usuario u, String codigoNivel) {
        Matricula m = new Matricula();
        m.setUsuario(u);
        m.setNivel(niveles.findByCodigo(codigoNivel).orElseThrow());
        m.setHorario(horarios.findAll().get(0));
        m.setEstado(EstadoMatricula.ACTIVA);
        m.setFechaInicio(LocalDate.now());
        m.setFechaFin(LocalDate.now().plusMonths(1));
        matriculas.save(m);
    }

    private String login(String usuario) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    private Long idClaseDeNivel(String codigoNivel) {
        return clases.findAll().stream().filter(c -> c.getNivel().getCodigo().equals(codigoNivel))
                .findFirst().orElseThrow().getId();
    }

    @Test
    @DisplayName("PRO-01 El alumno marca una clase como vista y favorita y el listado lo refleja")
    void marcarVistaYFavorita() throws Exception {
        Usuario alumno = crearUsuario("progreso." + sufijo, Rol.ALUMNO);
        matricular(alumno, "SECUNDARIA");
        String token = login(alumno.getUsername());
        Long claseId = idClaseDeNivel("SECUNDARIA");

        mvc.perform(put("/api/alumno/clases/" + claseId + "/progreso").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"vista\":true,\"favorita\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vista").value(true))
                .andExpect(jsonPath("$.favorita").value(true));

        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + claseId + ")].vista", contains(true)))
                .andExpect(jsonPath("$[?(@.id==" + claseId + ")].favorita", contains(true)));

        // quitar solo la marca de favorita no toca "vista"
        mvc.perform(put("/api/alumno/clases/" + claseId + "/progreso").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"favorita\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vista").value(true))
                .andExpect(jsonPath("$.favorita").value(false));
    }

    @Test
    @DisplayName("PRO-02 Sin matrícula vigente en el nivel no se puede guardar progreso (403) y una clase inexistente da 404")
    void progresoRequiereMatricula() throws Exception {
        Usuario alumno = crearUsuario("sinmat." + sufijo, Rol.ALUMNO);
        matricular(alumno, "PRIMARIA");
        String token = login(alumno.getUsername());
        mvc.perform(put("/api/alumno/clases/" + idClaseDeNivel("SECUNDARIA") + "/progreso").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"vista\":true}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/alumno/clases/" + idClaseDeNivel("SECUNDARIA") + "/abrir").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/alumno/clases/999999/progreso").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"vista\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PRO-03 Abrir una clase registra la última vez para \"Continuar viendo\"")
    void abrirClaseRegistraUltimaVez() throws Exception {
        Usuario alumno = crearUsuario("abrir." + sufijo, Rol.ALUMNO);
        matricular(alumno, "SECUNDARIA");
        String token = login(alumno.getUsername());
        Long claseId = idClaseDeNivel("SECUNDARIA");
        mvc.perform(post("/api/alumno/clases/" + claseId + "/abrir").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ultimaVez").exists())
                .andExpect(jsonPath("$.vista").value(false));
    }

    @Test
    @DisplayName("PRO-04 El panel admin muestra cuántos alumnos vieron cada clase")
    void adminVeVistas() throws Exception {
        Usuario alumno = crearUsuario("vistas." + sufijo, Rol.ALUMNO);
        matricular(alumno, "SECUNDARIA");
        String tokenAlumno = login(alumno.getUsername());
        Long claseId = idClaseDeNivel("SECUNDARIA");
        mvc.perform(put("/api/alumno/clases/" + claseId + "/progreso").header("Authorization", "Bearer " + tokenAlumno)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"vista\":true}"))
                .andExpect(status().isOk());

        crearUsuario("adm.vistas." + sufijo, Rol.ADMIN);
        String tokenAdmin = login("adm.vistas." + sufijo);
        mvc.perform(get("/api/admin/clases").header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + claseId + ")].vistas", contains(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("MAT-01 El admin matricula manualmente a un alumno: queda ACTIVA por los meses indicados")
    void adminCreaMatricula() throws Exception {
        crearUsuario("adm.mat." + sufijo, Rol.ADMIN);
        String tokenAdmin = login("adm.mat." + sufijo);
        Usuario alumno = crearUsuario("manual." + sufijo, Rol.ALUMNO);
        Long nivelId = niveles.findByCodigo("PRE").orElseThrow().getId();
        Long horarioId = horarios.findAll().get(0).getId();
        String cuerpo = "{\"usuarioId\":" + alumno.getId() + ",\"nivelId\":" + nivelId + ",\"horarioId\":" + horarioId + ",\"meses\":2}";

        mvc.perform(post("/api/admin/matriculas").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("ACTIVA"))
                .andExpect(jsonPath("$.fechaInicio").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.fechaFin").value(LocalDate.now().plusMonths(2).toString()));

        // duplicada en el mismo nivel → 409
        mvc.perform(post("/api/admin/matriculas").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isConflict());

        // a una cuenta ADMIN no se le matricula → 400
        Usuario otroAdmin = crearUsuario("adm.otro." + sufijo, Rol.ADMIN);
        mvc.perform(post("/api/admin/matriculas").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuarioId\":" + otroAdmin.getId() + ",\"nivelId\":" + nivelId + ",\"horarioId\":" + horarioId + "}"))
                .andExpect(status().isBadRequest());

        // meses fuera de rango → 400
        mvc.perform(post("/api/admin/matriculas").header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuarioId\":" + alumno.getId() + ",\"nivelId\":" + nivelId + ",\"horarioId\":" + horarioId + ",\"meses\":99}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("MAT-02 Un alumno no puede crear matrículas por la ruta de administración (403)")
    void alumnoNoCreaMatriculaAdmin() throws Exception {
        Usuario alumno = crearUsuario("intruso.mat." + sufijo, Rol.ALUMNO);
        String token = login(alumno.getUsername());
        mvc.perform(post("/api/admin/matriculas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuarioId\":" + alumno.getId() + ",\"nivelId\":1,\"horarioId\":1}"))
                .andExpect(status().isForbidden());
    }
}
