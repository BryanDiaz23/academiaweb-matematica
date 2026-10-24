package pe.matematicasinestres.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Límite de peticiones por IP en los endpoints públicos sensibles (ventana fija de 1 minuto).
 * Complementa el bloqueo por cuenta: frena la fuerza bruta contra muchas cuentas
 * y el spam de registros o solicitudes. Responde 429 Too Many Requests.
 */
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long VENTANA_MS = 60_000;
    private static final int MAX_CLAVES = 10_000;

    private record Ventana(long inicio, AtomicInteger contador) { }

    private final Map<String, Ventana> ventanas = new ConcurrentHashMap<>();
    private final Map<String, Integer> limites;

    /** @param limites ruta exacta (POST) → máximo de peticiones por minuto y por IP */
    public RateLimitFilter(Map<String, Integer> limites) {
        this.limites = Map.copyOf(limites);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Integer limite = "POST".equalsIgnoreCase(request.getMethod()) ? limites.get(request.getRequestURI()) : null;
        if (limite == null) {
            chain.doFilter(request, response);
            return;
        }
        long ahora = System.currentTimeMillis();
        String clave = request.getRequestURI() + "|" + request.getRemoteAddr();
        Ventana v = ventanas.compute(clave, (k, actual) ->
                actual == null || ahora - actual.inicio() >= VENTANA_MS ? new Ventana(ahora, new AtomicInteger()) : actual);
        if (ventanas.size() > MAX_CLAVES) {
            ventanas.entrySet().removeIf(e -> ahora - e.getValue().inicio() >= VENTANA_MS);
        }
        if (v.contador().incrementAndGet() > limite) {
            long espera = Math.max(1, (VENTANA_MS - (ahora - v.inicio()) + 999) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(espera));
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\","
                    + "\"mensaje\":\"Demasiados intentos. Espera " + espera + " segundos e inténtalo de nuevo.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
