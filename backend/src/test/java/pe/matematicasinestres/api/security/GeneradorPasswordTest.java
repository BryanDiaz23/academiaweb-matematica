package pe.matematicasinestres.api.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** Pruebas unitarias (sin Spring ni BD) del generador de contraseñas temporales. */
@Tag("unitaria")
class GeneradorPasswordTest {

    private final PasswordPolicy politica = new PasswordPolicy();
    private final GeneradorPassword generador = new GeneradorPassword(politica);

    @Test
    @DisplayName("UNIT-04 Las 300 contraseñas generadas cumplen la política y tienen 16 caracteres")
    void todasCumplenLaPolitica() {
        for (int i = 0; i < 300; i++) {
            String p = generador.generar("Ana Torres", "atorres", "ana.torres@correo.pe");
            assertThat(p).hasSize(16);
            assertThat(politica.validar(p, "Ana Torres", "atorres", "ana.torres@correo.pe"))
                    .as("la contraseña %s debe cumplir la política", p).isEmpty();
        }
    }

    @Test
    @DisplayName("UNIT-05 Las contraseñas generadas no contienen caracteres ambiguos (I, l, O, 0, 1)")
    void sinCaracteresAmbiguos() {
        for (int i = 0; i < 300; i++) {
            assertThat(generador.generar()).doesNotContain("I", "l", "O", "0", "1");
        }
    }

    @Test
    @DisplayName("UNIT-06 Son aleatorias: 300 generaciones producen 300 valores distintos")
    void sonAleatorias() {
        Set<String> distintas = new HashSet<>();
        for (int i = 0; i < 300; i++) {
            distintas.add(generador.generar());
        }
        assertThat(distintas).hasSize(300);
    }
}
