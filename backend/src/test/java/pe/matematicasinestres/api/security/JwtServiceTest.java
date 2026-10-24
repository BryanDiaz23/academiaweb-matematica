package pe.matematicasinestres.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.entity.Usuario;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Pruebas unitarias (sin Spring ni BD) de la emisión y validación de JWT. */
@Tag("unitaria")
class JwtServiceTest {

    private static final String EMISOR = "matematica-sin-estres";
    /** Clave de prueba de 32 bytes (256 bits) codificada en Base64. Solo existe en el entorno de pruebas. */
    private static final String SECRETO = Base64.getEncoder()
            .encodeToString("clave-de-pruebas-de-32-bytes!!!!".getBytes(StandardCharsets.UTF_8));
    private static final String OTRO_SECRETO = Base64.getEncoder()
            .encodeToString("otra-clave-distinta-de-32-bytes!".getBytes(StandardCharsets.UTF_8));

    private final JwtService servicio = new JwtService(SECRETO, 60, EMISOR);

    private Usuario alumno() {
        Rol rol = new Rol();
        rol.setNombre(Rol.ALUMNO);
        Usuario u = new Usuario();
        u.setUsername("ana.torres");
        u.setRol(rol);
        ReflectionTestUtils.setField(u, "id", 7L);
        return u;
    }

    @Test
    @DisplayName("UNIT-07 El token emitido se valida y contiene usuario, rol, emisor e id")
    void tokenValido() {
        Claims claims = servicio.validar(servicio.generarToken(alumno()));
        assertThat(claims.getSubject()).isEqualTo("ana.torres");
        assertThat(claims.get("rol", String.class)).isEqualTo(Rol.ALUMNO);
        assertThat(claims.getIssuer()).isEqualTo(EMISOR);
        assertThat(((Number) claims.get("uid")).longValue()).isEqualTo(7L);
        assertThat(claims.getId()).isNotBlank();
    }

    @Test
    @DisplayName("UNIT-08 Dos tokens del mismo usuario son distintos (identificador jti único)")
    void tokensUnicos() {
        assertThat(servicio.generarToken(alumno())).isNotEqualTo(servicio.generarToken(alumno()));
    }

    @Test
    @DisplayName("UNIT-09 Un token firmado con otra clave es rechazado")
    void firmaDeOtraClave() {
        String ajeno = new JwtService(OTRO_SECRETO, 60, EMISOR).generarToken(alumno());
        assertThatThrownBy(() -> servicio.validar(ajeno)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UNIT-10 Un token con el contenido alterado es rechazado")
    void contenidoAlterado() {
        String[] partes = servicio.generarToken(alumno()).split("\\.");
        String payloadFalso = Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"bryandiaz\",\"rol\":\"ADMIN\",\"iss\":\"" + EMISOR + "\"}").getBytes(StandardCharsets.UTF_8));
        String alterado = partes[0] + "." + payloadFalso + "." + partes[2];
        assertThatThrownBy(() -> servicio.validar(alterado)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UNIT-11 Un token vencido es rechazado")
    void tokenVencido() {
        String vencido = new JwtService(SECRETO, -5, EMISOR).generarToken(alumno());
        assertThatThrownBy(() -> servicio.validar(vencido)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UNIT-12 Un token de otro emisor es rechazado")
    void otroEmisor() {
        String ajeno = new JwtService(SECRETO, 60, "otro-sistema").generarToken(alumno());
        assertThatThrownBy(() -> servicio.validar(ajeno)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UNIT-13 Un token sin firma (alg: none) con rol ADMIN falsificado es rechazado")
    void algNone() {
        Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
        String cabecera = b64.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
        String payload = b64.encodeToString(
                ("{\"sub\":\"bryandiaz\",\"rol\":\"ADMIN\",\"iss\":\"" + EMISOR + "\"}").getBytes(StandardCharsets.UTF_8));
        String sinFirma = cabecera + "." + payload + ".";
        assertThatThrownBy(() -> servicio.validar(sinFirma)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("UNIT-14 El arranque falla si el secreto falta, no es Base64 o tiene menos de 256 bits")
    void secretoInvalido() {
        assertThatThrownBy(() -> new JwtService("", 60, EMISOR)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> new JwtService("###no-es-base64###", 60, EMISOR)).isInstanceOf(IllegalStateException.class);
        String corto = Base64.getEncoder().encodeToString("solo-16-bytes!!!".getBytes(StandardCharsets.UTF_8));
        assertThatThrownBy(() -> new JwtService(corto, 60, EMISOR)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("UNIT-15 La expiración informada al cliente coincide con los minutos configurados")
    void segundosDeExpiracion() {
        assertThat(servicio.getSegundosExpiracion()).isEqualTo(3600);
    }
}
