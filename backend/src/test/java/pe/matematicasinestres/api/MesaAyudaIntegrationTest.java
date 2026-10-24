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
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.repository.AuditoriaAccesoRepository;
import pe.matematicasinestres.api.repository.RolRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de la mesa de ayuda (gestión de solicitudes de servicio, APF3): catálogo, registro,
 * control de acceso, ciclo de vida con SLA y auditoría.
 */
@SpringBootTest(properties = "app.rate-limit.enabled=false")
@AutoConfigureMockMvc
class MesaAyudaIntegrationTest {

    private static final String PASS = "Kx#72mVq!Lp9wZ";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired RolRepository roles;
    @Autowired AuditoriaAccesoRepository auditoria;
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

    private String login(String usuario) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\",\"password\":\"" + PASS + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.token");
    }

    private String token(String prefijo, String rol) throws Exception {
        return login(crearUsuario(prefijo + "." + sufijo, rol).getUsername());
    }

    private static String cuerpo(String tipo, String asunto, String descripcion) {
        return "{\"tipo\":\"" + tipo + "\",\"asunto\":\"" + asunto + "\",\"descripcion\":\"" + descripcion + "\"}";
    }

    private Integer crearSolicitud(String token, String tipo) throws Exception {
        MvcResult r = mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(tipo, "No carga el video", "La clase del martes no carga en el celular.")))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(r.getResponse().getContentAsString(), "$.id");
    }

    private org.springframework.test.web.servlet.ResultActions atender(String admin, Integer id, String estado, String respuesta)
            throws Exception {
        String json = respuesta == null ? "{\"estado\":\"" + estado + "\"}"
                : "{\"estado\":\"" + estado + "\",\"respuesta\":\"" + respuesta + "\"}";
        return mvc.perform(patch("/api/admin/mesa-ayuda/" + id).header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    @DisplayName("MDA-01 El catálogo de servicios es público y define prioridad y SLA de cada tipo")
    void catalogoPublico() throws Exception {
        mvc.perform(get("/api/public/catalogo-servicios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(6)))
                .andExpect(jsonPath("$[?(@.tipo=='RESTABLECER_PASSWORD')].horasSla").value(contains(4)))
                .andExpect(jsonPath("$[?(@.tipo=='RESTABLECER_PASSWORD')].prioridad").value(contains("ALTA")))
                .andExpect(jsonPath("$[?(@.tipo=='INFORMACION')].horasSla").value(contains(24)));
    }

    @Test
    @DisplayName("MDA-02 Cada rol ve solo los tipos que puede pedir")
    void catalogoPorRol() throws Exception {
        mvc.perform(get("/api/mesa-ayuda/catalogo").header("Authorization", "Bearer " + token("cat.al", Rol.ALUMNO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].tipo", hasItem("CAMBIO_HORARIO")))
                .andExpect(jsonPath("$[*].tipo", not(hasItem("VINCULO_APODERADO"))));
        mvc.perform(get("/api/mesa-ayuda/catalogo").header("Authorization", "Bearer " + token("cat.pa", Rol.APODERADO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].tipo", hasItem("VINCULO_APODERADO")))
                .andExpect(jsonPath("$[*].tipo", not(hasItem("CAMBIO_HORARIO"))));
    }

    @Test
    @DisplayName("MDA-03 Un alumno registra una solicitud: queda ABIERTA, con código, prioridad y vencimiento del SLA")
    void registrarSolicitud() throws Exception {
        String alumno = token("reg.al", Rol.ALUMNO);
        mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + alumno)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo("SOPORTE_TECNICO", "No carga el video", "La clase del martes no carga en el celular.")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo", startsWith("SR-")))
                .andExpect(jsonPath("$.estado").value("ABIERTA"))
                .andExpect(jsonPath("$.prioridad").value("ALTA"))
                .andExpect(jsonPath("$.horasSla").value(8))
                .andExpect(jsonPath("$.estadoSla").value("EN_PLAZO"))
                .andExpect(jsonPath("$.venceEn").exists());
        mvc.perform(get("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + alumno))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @DisplayName("MDA-04 Validación: tipo fuera del catálogo, tipo de otro rol y HTML se rechazan con 400")
    void validacionDeEntrada() throws Exception {
        String alumno = token("val.al", Rol.ALUMNO);
        mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + alumno)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("BORRAR_TODO", "Asunto válido", "Descripción suficientemente larga")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + alumno)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("VINCULO_APODERADO", "Asunto válido", "Descripción suficientemente larga")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + alumno)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("INFORMACION", "<script>alert(1)</script>", "Descripción suficientemente larga")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("MDA-05 Control de acceso: sin token 401; el administrador no registra tickets; un alumno no entra al panel (403)")
    void controlDeAcceso() throws Exception {
        mvc.perform(get("/api/mesa-ayuda/solicitudes")).andExpect(status().isUnauthorized());
        String admin = token("acc.ad", Rol.ADMIN);
        String alumno = token("acc.al", Rol.ALUMNO);
        mvc.perform(get("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + admin)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/mesa-ayuda").header("Authorization", "Bearer " + alumno)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/mesa-ayuda/1").header("Authorization", "Bearer " + alumno)
                .contentType(MediaType.APPLICATION_JSON).content("{\"estado\":\"RESUELTA\",\"respuesta\":\"hackeado\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("MDA-06 Nadie ve ni cierra la solicitud de otro usuario (404, protección IDOR)")
    void solicitudAjena() throws Exception {
        String duenio = token("idor.a", Rol.ALUMNO);
        String otro = token("idor.b", Rol.APODERADO);
        Integer id = crearSolicitud(duenio, "INFORMACION");
        mvc.perform(get("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + otro))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(id))));
        mvc.perform(patch("/api/mesa-ayuda/solicitudes/" + id + "/cerrar").header("Authorization", "Bearer " + otro))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("MDA-07 Ciclo completo: ABIERTA → EN_PROCESO → RESUELTA (con respuesta) → CERRADA por el usuario")
    void cicloDeVida() throws Exception {
        String alumno = token("ciclo.al", Rol.ALUMNO);
        String admin = token("ciclo.ad", Rol.ADMIN);
        Integer id = crearSolicitud(alumno, "ACCESO_CUENTA");

        mvc.perform(patch("/api/mesa-ayuda/solicitudes/" + id + "/cerrar").header("Authorization", "Bearer " + alumno))
                .andExpect(status().isConflict());
        atender(admin, id, "EN_PROCESO", null).andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("EN_PROCESO"));
        atender(admin, id, "RESUELTA", null).andExpect(status().isBadRequest());
        atender(admin, id, "RESUELTA", "Ya activamos tu matrícula de Secundaria.")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RESUELTA"))
                .andExpect(jsonPath("$.resueltoEn").exists())
                .andExpect(jsonPath("$.estadoSla").value("CUMPLIDA"))
                .andExpect(jsonPath("$.atendidoPor").value("Usuario Prueba"));
        mvc.perform(patch("/api/mesa-ayuda/solicitudes/" + id + "/cerrar").header("Authorization", "Bearer " + alumno))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CERRADA"))
                .andExpect(jsonPath("$.respuesta").value("Ya activamos tu matrícula de Secundaria."));
    }

    @Test
    @DisplayName("MDA-08 Transiciones no permitidas responden 409 (una solicitud cerrada o rechazada no se reabre)")
    void transicionesInvalidas() throws Exception {
        String alumno = token("trans.al", Rol.ALUMNO);
        String admin = token("trans.ad", Rol.ADMIN);
        Integer id = crearSolicitud(alumno, "INFORMACION");
        atender(admin, id, "CERRADA", null).andExpect(status().isConflict());
        atender(admin, id, "RECHAZADA", "No corresponde a la academia.").andExpect(status().isOk());
        atender(admin, id, "EN_PROCESO", null).andExpect(status().isConflict());
        atender(admin, 999999, "EN_PROCESO", null).andExpect(status().isNotFound());
        atender(admin, id, "ABIERTA", null).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("MDA-09 Un usuario no puede tener más de 5 solicitudes pendientes (409)")
    void limiteDePendientes() throws Exception {
        String padre = token("lim.pa", Rol.APODERADO);
        for (int i = 0; i < 5; i++) {
            crearSolicitud(padre, "INFORMACION");
        }
        mvc.perform(post("/api/mesa-ayuda/solicitudes").header("Authorization", "Bearer " + padre)
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("INFORMACION", "Sexta consulta", "Otra consulta más sobre los precios.")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("MDA-10 Métricas del SLA y registro en la auditoría")
    void metricasYAuditoria() throws Exception {
        String alumno = token("met.al", Rol.ALUMNO);
        String admin = token("met.ad", Rol.ADMIN);
        Integer id = crearSolicitud(alumno, "RESTABLECER_PASSWORD");
        atender(admin, id, "RESUELTA", "Te enviamos una contraseña temporal.").andExpect(status().isOk());

        mvc.perform(get("/api/admin/mesa-ayuda/metricas").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.atendidas", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.porEstado.RESUELTA", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.porTipo.RESTABLECER_PASSWORD", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.cumplimientoSla").isNumber());
        mvc.perform(get("/api/admin/mesa-ayuda").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem(id)));

        assertThat(auditoria.findAll()).anyMatch(a -> a.getEvento() == EventoAuditoria.SOLICITUD_CREADA
                && a.getDetalle().contains("RESTABLECER_PASSWORD"));
        assertThat(auditoria.findAll()).anyMatch(a -> a.getEvento() == EventoAuditoria.SOLICITUD_ACTUALIZADA
                && a.getDetalle().contains("ABIERTA -> RESUELTA"));
    }

    @Test
    @DisplayName("VER-01 La API informa la versión desplegada (validación posterior al cambio)")
    void versionDesplegada() throws Exception {
        mvc.perform(get("/api/public/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.servicio").value("matematica-sin-estres-api"))
                .andExpect(jsonPath("$.version").isString());
        mvc.perform(get("/api/public/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("UP"))
                .andExpect(jsonPath("$.version").isString());
    }
}
