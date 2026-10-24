package pe.matematicasinestres.api.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Genera contraseñas temporales aleatorias que cumplen la política de seguridad.
 * Usa SecureRandom (generador criptográfico) y evita caracteres ambiguos (I, l, O, 0, 1).
 */
@Component
public class GeneradorPassword {

    private static final String MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String MINUS = "abcdefghijkmnpqrstuvwxyz";
    private static final String NUMEROS = "23456789";
    private static final String SIMBOLOS = "!#$%&*+-=?@^_";
    private static final String TODOS = MAYUS + MINUS + NUMEROS + SIMBOLOS;
    private static final int LONGITUD = 16;

    private final SecureRandom random = new SecureRandom();
    private final PasswordPolicy politica;

    public GeneradorPassword(PasswordPolicy politica) {
        this.politica = politica;
    }

    public String generar(String... datosPersonales) {
        for (int intento = 0; intento < 100; intento++) {
            char[] c = new char[LONGITUD];
            c[0] = elegir(MAYUS);
            c[1] = elegir(MINUS);
            c[2] = elegir(NUMEROS);
            c[3] = elegir(SIMBOLOS);
            for (int i = 4; i < LONGITUD; i++) {
                c[i] = elegir(TODOS);
            }
            for (int i = c.length - 1; i > 0; i--) {
                int j = random.nextInt(i + 1);
                char t = c[i];
                c[i] = c[j];
                c[j] = t;
            }
            String candidata = new String(c);
            if (politica.validar(candidata, datosPersonales).isEmpty()) {
                return candidata;
            }
        }
        throw new IllegalStateException("No se pudo generar una contraseña temporal válida.");
    }

    private char elegir(String fuente) {
        return fuente.charAt(random.nextInt(fuente.length()));
    }
}
