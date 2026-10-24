package pe.matematicasinestres.api.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import pe.matematicasinestres.api.entity.Usuario;

import java.util.Collection;
import java.util.List;

/** Identidad autenticada que viaja en el SecurityContext durante la petición. */
public class UsuarioPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String nombreCompleto;
    private final String rol;
    private final boolean activo;
    private final boolean bloqueado;
    private final boolean debeCambiarPassword;

    public UsuarioPrincipal(Usuario u) {
        this.id = u.getId();
        this.username = u.getUsername();
        this.nombreCompleto = u.getNombreCompleto();
        this.rol = u.getRol().getNombre();
        this.activo = u.isActivo();
        this.bloqueado = u.estaBloqueado();
        this.debeCambiarPassword = u.isDebeCambiarPassword();
    }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getRol() { return rol; }
    public boolean isDebeCambiarPassword() { return debeCambiarPassword; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Override
    public String getPassword() {
        return null; // el hash nunca se expone fuera de la capa de autenticación
    }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return !bloqueado; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return activo; }
}
