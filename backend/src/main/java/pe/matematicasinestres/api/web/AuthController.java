package pe.matematicasinestres.api.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pe.matematicasinestres.api.dto.*;
import pe.matematicasinestres.api.security.UsuarioPrincipal;
import pe.matematicasinestres.api.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** 200 con token JWT | 400 datos inválidos | 401 credenciales | 403 cuenta inactiva | 423 cuenta bloqueada */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        return authService.login(req, http.getRemoteAddr());
    }

    /** 201 creado | 400 contraseña débil o datos inválidos | 409 usuario/correo duplicado */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDto registrar(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        return authService.registrar(req, http.getRemoteAddr());
    }

    /** 200 perfil | 401 sin token o token inválido */
    @GetMapping("/me")
    public UsuarioDto perfil(@AuthenticationPrincipal UsuarioPrincipal yo) {
        return authService.perfil(yo.getId());
    }

    @PutMapping("/password")
    public MensajeResponse cambiarPassword(@AuthenticationPrincipal UsuarioPrincipal yo,
                                           @Valid @RequestBody CambioPasswordRequest req,
                                           HttpServletRequest http) {
        return authService.cambiarPassword(yo.getId(), req, http.getRemoteAddr());
    }
}
