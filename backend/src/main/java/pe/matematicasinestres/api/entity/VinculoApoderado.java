package pe.matematicasinestres.api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Autoriza a un apoderado a consultar el avance de un alumno. Lo crea solo el administrador. */
@Entity
@Table(name = "vinculos_apoderado")
public class VinculoApoderado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "apoderado_id", nullable = false)
    private Usuario apoderado;

    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "alumno_id", nullable = false)
    private Usuario alumno;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Parentesco parentesco = Parentesco.APODERADO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por")
    private Usuario creadoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @PrePersist
    void alCrear() {
        creadoEn = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Usuario getApoderado() { return apoderado; }
    public void setApoderado(Usuario apoderado) { this.apoderado = apoderado; }
    public Usuario getAlumno() { return alumno; }
    public void setAlumno(Usuario alumno) { this.alumno = alumno; }
    public Parentesco getParentesco() { return parentesco; }
    public void setParentesco(Parentesco parentesco) { this.parentesco = parentesco; }
    public Usuario getCreadoPor() { return creadoPor; }
    public void setCreadoPor(Usuario creadoPor) { this.creadoPor = creadoPor; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
