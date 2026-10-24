package pe.matematicasinestres.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import pe.matematicasinestres.api.security.JwtAuthenticationFilter;
import pe.matematicasinestres.api.security.JwtService;
import pe.matematicasinestres.api.security.RateLimitFilter;
import pe.matematicasinestres.api.security.RestAccessDeniedHandler;
import pe.matematicasinestres.api.security.RestAuthenticationEntryPoint;
import pe.matematicasinestres.api.security.UsuarioDetailsService;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Configuración central de seguridad:
 *  - API stateless con JWT (sin sesión de servidor ni cookies, por eso CSRF no aplica).
 *  - Autorización por roles (ADMIN, ALUMNO, APODERADO) en cada grupo de rutas (mitiga Broken Access Control).
 *  - BCrypt con factor de costo 12 para las contraseñas.
 *  - CORS restringido a los orígenes del front-end.
 *  - Encabezados de seguridad (CSP, X-Frame-Options, Referrer-Policy, nosniff, HSTS).
 *  - Límite de peticiones por IP en login, registro, solicitudes públicas y mesa de ayuda (429).
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String origenesPermitidos;

    @Value("${app.rate-limit.enabled:true}")
    private boolean rateLimitHabilitado;

    @Value("${app.rate-limit.login-por-minuto:10}")
    private int loginPorMinuto;

    @Value("${app.rate-limit.registro-por-minuto:5}")
    private int registroPorMinuto;

    @Value("${app.rate-limit.solicitudes-por-minuto:5}")
    private int solicitudesPorMinuto;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtService jwtService,
                                           UsuarioDetailsService usuarioDetailsService,
                                           RestAuthenticationEntryPoint entryPoint,
                                           RestAccessDeniedHandler accessDeniedHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .frameOptions(f -> f.deny())
                        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        // La API no necesita cámara, micrófono ni geolocalización: se deniegan explícitamente.
                        .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy", "camera=(), microphone=(), geolocation=()")))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(entryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/alumno/**").hasRole("ALUMNO")
                        .requestMatchers("/api/apoderado/**").hasRole("APODERADO")
                        .requestMatchers("/api/mesa-ayuda/**").hasAnyRole("ALUMNO", "APODERADO")
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, usuarioDetailsService),
                        UsernamePasswordAuthenticationFilter.class);
        if (rateLimitHabilitado) {
            http.addFilterBefore(new RateLimitFilter(Map.of(
                    "/api/auth/login", loginPorMinuto,
                    "/api/auth/register", registroPorMinuto,
                    "/api/public/solicitudes", solicitudesPorMinuto,
                    "/api/mesa-ayuda/solicitudes", solicitudesPorMinuto)), UsernamePasswordAuthenticationFilter.class);
        }
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> origenes = Arrays.stream(origenesPermitidos.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toList();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origenes);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
