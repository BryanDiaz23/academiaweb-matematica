package pe.matematicasinestres.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Rechaza texto con etiquetas HTML, esquemas "javascript:" o manejadores de eventos (onload=, onclick=...).
 * Primera capa de defensa contra Cross-Site Scripting (XSS) almacenado.
 */
@Documented
@Constraint(validatedBy = SinHtmlValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface SinHtml {
    String message() default "no puede contener etiquetas HTML ni código";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
