package pe.matematicasinestres.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Lee el encabezado "Authorization: Bearer <token>", valida el JWT y, si es correcto
 * y la cuenta sigue activa y sin bloqueo, registra la identidad en el SecurityContext.
 * No se declara como @Component para que solo se ejecute dentro de la cadena de Spring Security.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String ATRIBUTO_ERROR = "mse.jwt.error";
    private static final String PREFIJO = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioDetailsService usuarioDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioDetailsService usuarioDetailsService) {
        this.jwtService = jwtService;
        this.usuarioDetailsService = usuarioDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith(PREFIJO)) {
            String token = header.substring(PREFIJO.length()).trim();
            try {
                Claims claims = jwtService.validar(token);
                UsuarioPrincipal principal = usuarioDetailsService.loadUserByUsername(claims.getSubject());
                if (!principal.isEnabled() || !principal.isAccountNonLocked()) {
                    request.setAttribute(ATRIBUTO_ERROR, "La cuenta está inactiva o bloqueada.");
                } else if (principal.isDebeCambiarPassword() && !rutaPermitidaConPasswordTemporal(request)) {
                    responderCambioRequerido(request, response);
                    return;
                } else {
                    var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException e) {
                SecurityContextHolder.clearContext();
                request.setAttribute(ATRIBUTO_ERROR, "Token inválido, alterado o expirado.");
            }
        }
        chain.doFilter(request, response);
    }

    /** Con contraseña temporal solo se permite ver el perfil y cambiar la contraseña. */
    private static boolean rutaPermitidaConPasswordTemporal(HttpServletRequest request) {
        String ruta = request.getRequestURI();
        return ruta.equals("/api/auth/me") || ruta.equals("/api/auth/password") || ruta.startsWith("/api/public/");
    }

    private static void responderCambioRequerido(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String ruta = request.getRequestURI().replaceAll("[\"\\\\]", "");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"codigo\":\"CAMBIO_PASSWORD_REQUERIDO\","
                + "\"mensaje\":\"Debes cambiar tu contraseña temporal antes de continuar.\",\"ruta\":\"" + ruta + "\"}");
    }
}
