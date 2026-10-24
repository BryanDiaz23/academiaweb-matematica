package pe.matematicasinestres.api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Progreso de un alumno en una clase grabada: vista, favorita y última vez que la abrió. */
@Entity
@Table(name = "progreso_clases")
public class ProgresoClase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "clase_id", nullable = false)
    private ClaseGrabada clase;

    @Column(nullable = false)
    private boolean vista = false;

    @Column(nullable = false)
    private boolean favorita = false;

    @Column(name = "ultima_vez")
    private LocalDateTime ultimaVez;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    @PrePersist
    @PreUpdate
    void alGuardar() {
        actualizadoEn = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public ClaseGrabada getClase() { return clase; }
    public void setClase(ClaseGrabada clase) { this.clase = clase; }
    public boolean isVista() { return vista; }
    public void setVista(boolean vista) { this.vista = vista; }
    public boolean isFavorita() { return favorita; }
    public void setFavorita(boolean favorita) { this.favorita = favorita; }
    public LocalDateTime getUltimaVez() { return ultimaVez; }
    public void setUltimaVez(LocalDateTime ultimaVez) { this.ultimaVez = ultimaVez; }
    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
}
