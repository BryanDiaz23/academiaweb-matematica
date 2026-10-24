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

/**
 * Pruebas del portal de padres y apoderados: registro del rol, vínculo creado por el administrador,
 * informe de avance y control de acceso (un padre solo ve a sus hijos).
 */
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class ApoderadoIntegrationTest {

    private static final String PASS = "Kx#72mVq!Lp9wZ";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired RolRepository roles;
    @Autowired NivelRepository niveles;
    @Autowired HorarioRepository horarios;
    @Autowired MatriculaRepository matriculas;
    @Autowired ClaseGrabadaRepository clases;
    @Autowired VinculoApoderadoRepository vinculos;
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

    private String vincularComoAdmin(Usuario apoderado, Usuario alumno, String parentesco) throws Exception {
        Usuario admin = crearUsuario("admvinc." + UUID.randomUUID().toString().substring(0, 8), Rol.ADMIN);
        String token = login(admin.getUsername());
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + apoderado.getId() + ",\"alumnoId\":" + alumno.getId()
                                + ",\"parentesco\":\"" + parentesco + "\"}"))
                .andExpect(status().isCreated());
        return token;
    }

    @Test
    @DisplayName("APO-01 Se puede registrar una cuenta de apoderado, pero nunca de administrador")
    void registroDeApoderado() throws Exception {
        String user = "madre." + sufijo;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Madre Prueba\",\"username\":\"" + user + "\",\"email\":\"" + user
                                + "@test.pe\",\"password\":\"" + PASS + "\",\"confirmarPassword\":\"" + PASS
                                + "\",\"tipoCuenta\":\"APODERADO\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("APODERADO"));

        String otro = "intruso." + sufijo;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Intruso Prueba\",\"username\":\"" + otro + "\",\"email\":\"" + otro
                                + "@test.pe\",\"password\":\"" + PASS + "\",\"confirmarPassword\":\"" + PASS
                                + "\",\"tipoCuenta\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest());
        org.assertj.core.api.Assertions.assertThat(usuarios.findByUsernameIgnoreCase(otro)).isEmpty();
    }

    @Test
    @DisplayName("APO-02 Sin tipoCuenta el registro sigue creando un alumno (compatibilidad)")
    void registroPorDefectoEsAlumno() throws Exception {
        String user = "alumno." + sufijo;
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCompleto\":\"Alumno Prueba\",\"username\":\"" + user + "\",\"email\":\"" + user
                                + "@test.pe\",\"password\":\"" + PASS + "\",\"confirmarPassword\":\"" + PASS + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("ALUMNO"));
    }

    @Test
    @DisplayName("APO-03 Cada rol solo entra a sus rutas: sin token 401, rol equivocado 403")
    void controlDeAccesoPorRol() throws Exception {
        mvc.perform(get("/api/apoderado/hijos")).andExpect(status().isUnauthorized());

        String alumno = login(crearUsuario("rolal." + sufijo, Rol.ALUMNO).getUsername());
        String admin = login(crearUsuario("rolad." + sufijo, Rol.ADMIN).getUsername());
        String padre = login(crearUsuario("rolpa." + sufijo, Rol.APODERADO).getUsername());

        mvc.perform(get("/api/apoderado/hijos").header("Authorization", "Bearer " + alumno)).andExpect(status().isForbidden());
        mvc.perform(get("/api/apoderado/hijos").header("Authorization", "Bearer " + admin)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/vinculos").header("Authorization", "Bearer " + padre)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/usuarios").header("Authorization", "Bearer " + padre)).andExpect(status().isForbidden());
        mvc.perform(get("/api/alumno/clases").header("Authorization", "Bearer " + padre)).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + padre)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"apoderadoId\":1,\"alumnoId\":2}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("APO-04 Un apoderado sin hijos vinculados recibe una lista vacía")
    void sinHijos() throws Exception {
        String padre = login(crearUsuario("sinhijos." + sufijo, Rol.APODERADO).getUsername());
        mvc.perform(get("/api/apoderado/hijos").header("Authorization", "Bearer " + padre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("APO-05 El administrador vincula; rechaza roles equivocados (400) y vínculos repetidos (409)")
    void crearVinculo() throws Exception {
        Usuario padre = crearUsuario("vpadre." + sufijo, Rol.APODERADO);
        Usuario hijo = crearUsuario("vhijo." + sufijo, Rol.ALUMNO);
        String admin = vincularComoAdmin(padre, hijo, "PADRE");

        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + padre.getId() + ",\"alumnoId\":" + hijo.getId() + "}"))
                .andExpect(status().isConflict());
        // un alumno no puede hacer de apoderado ni un apoderado de alumno
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + hijo.getId() + ",\"alumnoId\":" + hijo.getId() + "}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + padre.getId() + ",\"alumnoId\":" + padre.getId() + "}"))
                .andExpect(status().isBadRequest());
        // parentesco inválido y datos faltantes
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + padre.getId() + ",\"alumnoId\":" + hijo.getId() + ",\"parentesco\":\"TIO\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // usuario inexistente
        mvc.perform(post("/api/admin/vinculos").header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"apoderadoId\":" + padre.getId() + ",\"alumnoId\":999999}"))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/admin/vinculos").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.apoderadoId==" + padre.getId() + ")].parentesco", contains("PADRE")));
    }

    @Test
    @DisplayName("APO-06 El apoderado ve el avance real de su hijo y el informe no incluye enlaces de video")
    void apoderadoVeAvance() throws Exception {
        Usuario padre = crearUsuario("avpadre." + sufijo, Rol.APODERADO);
        Usuario hijo = crearUsuario("avhijo." + sufijo, Rol.ALUMNO);
        matricular(hijo, "SECUNDARIA");
        vincularComoAdmin(padre, hijo, "MADRE");

        String tokenHijo = login(hijo.getUsername());
        Long claseId = idClaseDeNivel("SECUNDARIA");
        mvc.perform(put("/api/alumno/clases/" + claseId + "/progreso").header("Authorization", "Bearer " + tokenHijo)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"vista\":true}"))
                .andExpect(status().isOk());

        String tokenPadre = login(padre.getUsername());
        mvc.perform(get("/api/apoderado/hijos").header("Authorization", "Bearer " + tokenPadre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].alumnoId").value(hijo.getId().intValue()))
                .andExpect(jsonPath("$[0].parentesco").value("MADRE"))
                .andExpect(jsonPath("$[0].clasesVistas").value(1))
                .andExpect(jsonPath("$[0].porcentaje", greaterThan(0)))
                .andExpect(jsonPath("$[0].estado").value("AL_DIA"));

        mvc.perform(get("/api/apoderado/hijos/" + hijo.getId() + "/avance").header("Authorization", "Bearer " + tokenPadre))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clasesVistas").value(1))
                .andExpect(jsonPath("$.totalClases", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.semanas", hasSize(6)))
                .andExpect(jsonPath("$.niveles[0].codigo").value("SECUNDARIA"))
                .andExpect(jsonPath("$.clases[0].urlVideo").doesNotExist())
                .andExpect(jsonPath("$.clases[0].urlPizarra").doesNotExist());
    }

    @Test
    @DisplayName("APO-07 Un apoderado no puede ver a un alumno que no es su hijo (403, igual que si no existiera)")
    void noVeAlumnosAjenos() throws Exception {
        Usuario padre = crearUsuario("idorpadre." + sufijo, Rol.APODERADO);
        Usuario hijo = crearUsuario("idorhijo." + sufijo, Rol.ALUMNO);
        Usuario ajeno = crearUsuario("idorajeno." + sufijo, Rol.ALUMNO);
        vincularComoAdmin(padre, hijo, "PADRE");
        String token = login(padre.getUsername());

        mvc.perform(get("/api/apoderado/hijos/" + ajeno.getId() + "/avance").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/apoderado/hijos/999999/avance").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        // el hijo ajeno tampoco aparece en el listado del padre
        mvc.perform(get("/api/apoderado/hijos").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$[?(@.alumnoId==" + ajeno.getId() + ")]", hasSize(0)));
    }

    @Test
    @DisplayName("APO-08 Al eliminar el vínculo el apoderado pierde el acceso de inmediato")
    void eliminarVinculo() throws Exception {
        Usuario padre = crearUsuario("delpadre." + sufijo, Rol.APODERADO);
        Usuario hijo = crearUsuario("delhijo." + sufijo, Rol.ALUMNO);
        String admin = vincularComoAdmin(padre, hijo, "TUTOR");
        String tokenPadre = login(padre.getUsername());
        mvc.perform(get("/api/apoderado/hijos/" + hijo.getId() + "/avance").header("Authorization", "Bearer " + tokenPadre))
                .andExpect(status().isOk());

        Long vinculoId = vinculos.findByApoderadoIdAndAlumnoId(padre.getId(), hijo.getId()).orElseThrow().getId();
        mvc.perform(delete("/api/admin/vinculos/" + vinculoId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/admin/vinculos/" + vinculoId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/apoderado/hijos/" + hijo.getId() + "/avance").header("Authorization", "Bearer " + tokenPadre))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("APO-09 El administrador ve el avance de cualquier alumno; pedir el de un apoderado da 404")
    void adminVeAvance() throws Exception {
        Usuario hijo = crearUsuario("adavhijo." + sufijo, Rol.ALUMNO);
        Usuario padre = crearUsuario("adavpadre." + sufijo, Rol.APODERADO);
        matricular(hijo, "PRIMARIA");
        String admin = login(crearUsuario("adavadmin." + sufijo, Rol.ADMIN).getUsername());

        mvc.perform(get("/api/admin/alumnos/" + hijo.getId() + "/avance").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alumnoId").value(hijo.getId().intValue()))
                .andExpect(jsonPath("$.estado").value("NUEVO"));
        mvc.perform(get("/api/admin/alumnos/" + padre.getId() + "/avance").header("Authorization", "Bearer " + admin))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("APO-10 Crear y eliminar un vínculo queda registrado en la auditoría")
    void auditaVinculos() throws Exception {
        Usuario padre = crearUsuario("audpadre." + sufijo, Rol.APODERADO);
        Usuario hijo = crearUsuario("audhijo." + sufijo, Rol.ALUMNO);
        String admin = vincularComoAdmin(padre, hijo, "PADRE");
        Long vinculoId = vinculos.findByApoderadoIdAndAlumnoId(padre.getId(), hijo.getId()).orElseThrow().getId();
        mvc.perform(delete("/api/admin/vinculos/" + vinculoId).header("Authorization", "Bearer " + admin))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/admin/auditoria").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.evento=='VINCULO_CREADO' && @.identificador=='" + padre.getUsername() + "')]", hasSize(1)))
                .andExpect(jsonPath("$[?(@.evento=='VINCULO_ELIMINADO' && @.identificador=='" + padre.getUsername() + "')]", hasSize(1)));
    }
}
