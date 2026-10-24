package pe.matematicasinestres.api.security;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Política de contraseñas robustas (alineada a OWASP ASVS V2.1 y NIST SP 800-63B).
 * La misma regla se replica en el front-end para dar retroalimentación inmediata,
 * pero la validación que manda es siempre la del servidor.
 */
@Component
public class PasswordPolicy {

    public static final int LONGITUD_MINIMA = 12;
    public static final int LONGITUD_MAXIMA = 64; // BCrypt solo usa los primeros 72 bytes

    private static final Set<String> PALABRAS_COMUNES = Set.of(
            "password", "contrasena", "clave", "qwerty", "asdf", "zxcv", "123456", "12345678",
            "111111", "000000", "abc123", "admin", "administrador", "usuario", "letmein",
            "welcome", "bienvenido", "iloveyou", "teamo", "dragon", "monkey", "football",
            "matematica", "matematicas", "sinestres", "estres", "academia", "peru", "lima"
    );

    public List<String> validar(String password, String... datosPersonales) {
        List<String> errores = new ArrayList<>();
        if (password == null || password.isEmpty()) {
            errores.add("La contraseña es obligatoria.");
            return errores;
        }
        if (password.length() < LONGITUD_MINIMA) {
            errores.add("Debe tener al menos " + LONGITUD_MINIMA + " caracteres.");
        }
        if (password.length() > LONGITUD_MAXIMA) {
            errores.add("No puede superar " + LONGITUD_MAXIMA + " caracteres.");
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            errores.add("Debe incluir al menos una letra MAYÚSCULA.");
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            errores.add("Debe incluir al menos una letra minúscula.");
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            errores.add("Debe incluir al menos un número.");
        }
        if (password.chars().noneMatch(c -> !Character.isLetterOrDigit(c) && !Character.isWhitespace(c))) {
            errores.add("Debe incluir al menos un símbolo (por ejemplo ! # $ % & * @ ?).");
        }
        if (password.chars().anyMatch(Character::isWhitespace)) {
            errores.add("No puede contener espacios.");
        }
        if (tieneRepeticiones(password)) {
            errores.add("No puede repetir el mismo carácter 3 veces seguidas (ej. aaa, 111).");
        }
        if (tieneSecuencias(password)) {
            errores.add("No puede contener secuencias de 4 o más caracteres (ej. 1234, abcd, 4321).");
        }
        String normal = normalizar(password);
        for (String palabra : PALABRAS_COMUNES) {
            if (normal.contains(palabra)) {
                errores.add("No puede contener palabras o patrones comunes como \"" + palabra + "\".");
                break;
            }
        }
        for (String dato : datosPersonales) {
            if (contieneDatoPersonal(normal, dato)) {
                errores.add("No puede contener tu nombre, usuario o correo.");
                break;
            }
        }
        return errores;
    }

    private static boolean tieneRepeticiones(String s) {
        for (int i = 2; i < s.length(); i++) {
            if (s.charAt(i) == s.charAt(i - 1) && s.charAt(i) == s.charAt(i - 2)) {
                return true;
            }
        }
        return false;
    }

    private static boolean tieneSecuencias(String s) {
        String t = s.toLowerCase(Locale.ROOT);
        for (int i = 0; i + 3 < t.length(); i++) {
            char a = t.charAt(i), b = t.charAt(i + 1), c = t.charAt(i + 2), d = t.charAt(i + 3);
            boolean mismaClase = (Character.isDigit(a) && Character.isDigit(b) && Character.isDigit(c) && Character.isDigit(d))
                    || (esLetraAscii(a) && esLetraAscii(b) && esLetraAscii(c) && esLetraAscii(d));
            if (!mismaClase) {
                continue;
            }
            boolean asc = b - a == 1 && c - b == 1 && d - c == 1;
            boolean desc = a - b == 1 && b - c == 1 && c - d == 1;
            if (asc || desc) {
                return true;
            }
        }
        return false;
    }

    private static boolean esLetraAscii(char c) {
        return c >= 'a' && c <= 'z';
    }

    private static boolean contieneDatoPersonal(String passwordNormal, String dato) {
        if (dato == null || dato.isBlank()) {
            return false;
        }
        String base = normalizar(dato);
        int arroba = base.indexOf('@');
        if (arroba > 0) {
            base = base.substring(0, arroba);
        }
        for (String parte : base.split("[^a-z0-9]+")) {
            if (parte.length() >= 3 && passwordNormal.contains(parte)) {
                return true;
            }
        }
        String compacto = base.replaceAll("[^a-z0-9]", "");
        return compacto.length() >= 3 && passwordNormal.contains(compacto);
    }

    static String normalizar(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.toLowerCase(Locale.ROOT);
    }
}
