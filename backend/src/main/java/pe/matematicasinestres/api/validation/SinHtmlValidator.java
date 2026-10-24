package pe.matematicasinestres.api.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Locale;
import java.util.regex.Pattern;

public class SinHtmlValidator implements ConstraintValidator<SinHtml, String> {

    private static final Pattern PELIGROSO = Pattern.compile(
            "[<>]|javascript\\s*:|vbscript\\s*:|data\\s*:\\s*text/html|\\bon[a-z]+\\s*=",
            Pattern.CASE_INSENSITIVE);

    @Override
    public boolean isValid(String valor, ConstraintValidatorContext ctx) {
        if (valor == null || valor.isEmpty()) {
            return true;
        }
        return !PELIGROSO.matcher(valor.toLowerCase(Locale.ROOT)).find();
    }
}
