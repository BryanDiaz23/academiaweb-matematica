package pe.matematicasinestres.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import pe.matematicasinestres.api.exception.ApiError;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Responde 401 en JSON cuando falta el token o es inválido. */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    public RestAuthenticationEntryPoint(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        Object detalle = request.getAttribute(JwtAuthenticationFilter.ATRIBUTO_ERROR);
        String mensaje = detalle != null ? detalle.toString() : "Debes iniciar sesión para acceder a este recurso.";
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("WWW-Authenticate", "Bearer");
        mapper.writeValue(response.getOutputStream(), ApiError.of(401, "Unauthorized", mensaje, request.getRequestURI(), null));
    }
}
