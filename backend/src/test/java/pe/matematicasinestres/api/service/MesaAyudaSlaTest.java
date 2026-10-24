package pe.matematicasinestres.api.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import pe.matematicasinestres.api.entity.EstadoSolicitud;
import pe.matematicasinestres.api.entity.SolicitudServicio;
import pe.matematicasinestres.api.entity.TipoSolicitud;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/** Cálculo del estado del SLA de una solicitud de servicio (sin base de datos). */
@Tag("unitaria")
class MesaAyudaSlaTest {

    private static final LocalDateTime CREADA = LocalDateTime.of(2026, 10, 20, 8, 0);

    private static SolicitudServicio solicitud(EstadoSolicitud estado, LocalDateTime resuelto) {
        SolicitudServicio s = new SolicitudServicio();
        s.setTipo(TipoSolicitud.SOPORTE_TECNICO); // SLA de 8 horas
        s.setEstado(estado);
        ReflectionTestUtils.setField(s, "creadoEn", CREADA);
        ReflectionTestUtils.setField(s, "actualizadoEn", CREADA);
        s.setVenceEn(CREADA.plusHours(8));
        s.setResueltoEn(resuelto);
        return s;
    }

    @Test
    @DisplayName("SLA-01 Pendiente con más del 25 % del plazo restante: EN_PLAZO")
    void enPlazo() {
        assertThat(MesaAyudaService.estadoSla(solicitud(EstadoSolicitud.ABIERTA, null), CREADA.plusHours(5))).isEqualTo("EN_PLAZO");
    }

    @Test
    @DisplayName("SLA-02 Pendiente con menos del 25 % del plazo restante: POR_VENCER")
    void porVencer() {
        assertThat(MesaAyudaService.estadoSla(solicitud(EstadoSolicitud.EN_PROCESO, null), CREADA.plusHours(7))).isEqualTo("POR_VENCER");
    }

    @Test
    @DisplayName("SLA-03 Pendiente pasado el vencimiento: VENCIDA")
    void vencida() {
        assertThat(MesaAyudaService.estadoSla(solicitud(EstadoSolicitud.ABIERTA, null), CREADA.plusHours(9))).isEqualTo("VENCIDA");
    }

    @Test
    @DisplayName("SLA-04 Resuelta a tiempo: CUMPLIDA; resuelta tarde: INCUMPLIDA")
    void resueltas() {
        LocalDateTime despues = CREADA.plusDays(3);
        assertThat(MesaAyudaService.estadoSla(solicitud(EstadoSolicitud.RESUELTA, CREADA.plusHours(2)), despues)).isEqualTo("CUMPLIDA");
        assertThat(MesaAyudaService.estadoSla(solicitud(EstadoSolicitud.CERRADA, CREADA.plusHours(10)), despues)).isEqualTo("INCUMPLIDA");
    }

    @Test
    @DisplayName("SLA-05 Transiciones permitidas del ciclo de vida")
    void transiciones() {
        assertThat(EstadoSolicitud.ABIERTA.siguientes()).contains(EstadoSolicitud.EN_PROCESO, EstadoSolicitud.RESUELTA, EstadoSolicitud.RECHAZADA);
        assertThat(EstadoSolicitud.RESUELTA.siguientes()).contains(EstadoSolicitud.CERRADA, EstadoSolicitud.EN_PROCESO);
        assertThat(EstadoSolicitud.CERRADA.siguientes()).isEmpty();
        assertThat(EstadoSolicitud.RECHAZADA.siguientes()).isEmpty();
    }
}
