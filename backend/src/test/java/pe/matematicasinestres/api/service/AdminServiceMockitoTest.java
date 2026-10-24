package pe.matematicasinestres.api.service;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import pe.matematicasinestres.api.dto.PasswordTemporalDto;
import pe.matematicasinestres.api.entity.EventoAuditoria;
import pe.matematicasinestres.api.entity.Usuario;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.*;
import pe.matematicasinestres.api.security.GeneradorPassword;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Pruebas unitarias con Mockito (sin base de datos): lógica de restablecimiento de contraseña. */
@Tag("unitaria")
@ExtendWith(MockitoExtension.class)
class AdminServiceMockitoTest {

    @Mock UsuarioRepository usuarios;
    @Mock MatriculaRepository matriculas;
    @Mock ClaseGrabadaRepository clases;
    @Mock SolicitudInformacionRepository solicitudes;
    @Mock AuditoriaAccesoRepository auditoriaRepo;
    @Mock AuditoriaService auditoria;
    @Mock GeneradorPassword generador;
    @Mock PasswordEncoder encoder;

    @InjectMocks AdminService servicio;

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setNombreCompleto("Alumno Prueba");
        u.setUsername("alumno.prueba");
        u.setEmail("alumno.prueba@test.pe");
        u.setIntentosFallidos(4);
        u.setBloqueadoHasta(LocalDateTime.now().plusMinutes(10));
        return u;
    }

    @Test
    @DisplayName("UNIT-01 Restablecer guarda solo el hash, desbloquea y obliga a cambiar la contraseña")
    void restableceYGuardaHash() {
        Usuario u = usuario();
        when(usuarios.findById(5L)).thenReturn(Optional.of(u));
        when(generador.generar(anyString(), anyString(), anyString())).thenReturn("Tmp#4kQz9Wm2Lp");
        when(encoder.encode("Tmp#4kQz9Wm2Lp")).thenReturn("$2a$12$hashsimulado");

        PasswordTemporalDto r = servicio.restablecerPassword(5L, 1L, "127.0.0.1");

        assertThat(r.passwordTemporal()).isEqualTo("Tmp#4kQz9Wm2Lp");
        assertThat(u.getPasswordHash()).isEqualTo("$2a$12$hashsimulado");
        assertThat(u.isDebeCambiarPassword()).isTrue();
        assertThat(u.getIntentosFallidos()).isZero();
        assertThat(u.getBloqueadoHasta()).isNull();
        verify(usuarios).save(u);
        verify(auditoria).registrar(eq(u), eq("alumno.prueba"), eq(EventoAuditoria.PASSWORD_RESTABLECIDA), anyString(), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("UNIT-02 El administrador no puede restablecer su propia contraseña (400) y no se toca la BD")
    void noSobreSiMismo() {
        assertThatThrownBy(() -> servicio.restablecerPassword(1L, 1L, "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verifyNoInteractions(usuarios, generador, encoder, auditoria);
    }

    @Test
    @DisplayName("UNIT-03 Usuario inexistente devuelve 404")
    void usuarioInexistente() {
        when(usuarios.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> servicio.restablecerPassword(99L, 1L, "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(usuarios, never()).save(any());
    }
}
