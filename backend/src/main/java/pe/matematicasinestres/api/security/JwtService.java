package pe.matematicasinestres.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import pe.matematicasinestres.api.entity.Usuario;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * Emisión y validación de JSON Web Tokens firmados con HMAC-SHA (clave >= 256 bits).
 * El servidor no guarda sesiones: cada petición se autentica con el token (stateless).
 */
@Service
public class JwtService {

    private final SecretKey clave;
    private final long minutosExpiracion;
    private final String emisor;

    public JwtService(@Value("${app.jwt.secret}") String secretoBase64,
                      @Value("${app.jwt.expiration-minutes}") long minutosExpiracion,
                      @Value("${app.jwt.issuer}") String emisor) {
        if (secretoBase64 == null || secretoBase64.isBlank()) {
            throw new IllegalStateException("Falta la variable de entorno JWT_SECRET (clave Base64 de al menos 256 bits).");
        }
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secretoBase64.trim());
        } catch (RuntimeException e) {
            throw new IllegalStateException("JWT_SECRET debe estar codificado en Base64.", e);
        }
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 256 bits (32 bytes) para HS256.");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.minutosExpiracion = minutosExpiracion;
        this.emisor = emisor;
    }

    public String generarToken(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(emisor)
                .subject(usuario.getUsername())
                .claim("uid", usuario.getId())
                .claim("rol", usuario.getRol().getNombre())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(minutosExpiracion, ChronoUnit.MINUTES)))
                .signWith(clave)
                .compact();
    }

    /**
     * Verifica firma, emisor y expiración. Lanza JwtException si el token fue
     * alterado, está vencido, no está firmado ("alg: none") o es de otro emisor.
     */
    public Claims validar(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(clave)
                .requireIssuer(emisor)
                .clockSkewSeconds(30)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getSegundosExpiracion() {
        return minutosExpiracion * 60;
    }
}
