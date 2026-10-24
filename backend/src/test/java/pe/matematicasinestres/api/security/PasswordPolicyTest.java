package pe.matematicasinestres.api.security;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias de la política de contraseñas robustas. */
@Tag("unitaria")
class PasswordPolicyTest {

    private final PasswordPolicy politica = new PasswordPolicy();

    @Test
    void aceptaContrasenaRobusta() {
        assertThat(politica.validar("Vr#9kQ!m2Lp@xZ", "Ana Torres", "atorres", "ana@correo.pe")).isEmpty();
    }

    @ParameterizedTest(name = "rechaza \"{0}\"")
    @ValueSource(strings = {
            "123456",              // corta, sin letras ni símbolos
            "contraseña",          // corta y común
            "Password12345!",      // palabra común + secuencia
            "Abcdefghijk1!",       // secuencia abcd
            "Qwerty#2026Xy",       // patrón de teclado común
            "Vr#9kQ!mmm2Lp@x",     // tres caracteres iguales seguidos
            "Vr9kQm2LpxZtw",       // sin símbolo
            "vr#9kq!m2lp@xz",      // sin mayúscula
            "VR#9KQ!M2LP@XZ",      // sin minúscula
            "Vr#kQ!mLp@xZtw",      // sin número
            "Vr#9kQ! m2Lp@xZ"      // contiene espacio
    })
    void rechazaContrasenasDebiles(String debil) {
        assertThat(politica.validar(debil)).isNotEmpty();
    }

    @Test
    void rechazaContrasenaConDatosPersonales() {
        List<String> errores = politica.validar("Bryan#Diaz9k!Q", "Bryan Díaz", "bryandiaz", "bryan.diaz@correo.pe");
        assertThat(errores).contains("No puede contener tu nombre, usuario o correo.");
    }

    @Test
    void rechazaContrasenaDemasiadoLarga() {
        String larga = "Ab#1" + "xQ7!".repeat(20);
        assertThat(politica.validar(larga)).anyMatch(e -> e.startsWith("No puede superar"));
    }
}
