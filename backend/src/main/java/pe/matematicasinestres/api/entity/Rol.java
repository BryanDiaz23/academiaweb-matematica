package pe.matematicasinestres.api.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Rol {

    public static final String ADMIN = "ADMIN";
    public static final String ALUMNO = "ALUMNO";
    public static final String APODERADO = "APODERADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String nombre;

    @Column(length = 150)
    private String descripcion;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
