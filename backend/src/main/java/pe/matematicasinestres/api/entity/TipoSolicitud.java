package pe.matematicasinestres.api.entity;

import java.util.Set;

/**
 * Catálogo de solicitudes de servicio. Cada tipo define quién puede pedirlo, su prioridad
 * y el tiempo máximo de resolución comprometido (SLA, en horas calendario).
 */
public enum TipoSolicitud {
    INFORMACION("Solicitud de información", "Consultas sobre niveles, precios, horarios o pagos.",
            PrioridadSolicitud.BAJA, 24, Set.of(Rol.ALUMNO, Rol.APODERADO)),
    ACCESO_CUENTA("Acceso a la cuenta o a una clase", "No puedo ver una clase de mi nivel o mi cuenta tiene un problema de acceso.",
            PrioridadSolicitud.ALTA, 8, Set.of(Rol.ALUMNO, Rol.APODERADO)),
    RESTABLECER_PASSWORD("Restablecer contraseña", "Pedir una contraseña temporal para una cuenta (por ejemplo, la de mi hijo).",
            PrioridadSolicitud.ALTA, 4, Set.of(Rol.ALUMNO, Rol.APODERADO)),
    CAMBIO_HORARIO("Cambio de turno u horario", "Pasar mi matrícula a otro turno de clases en vivo.",
            PrioridadSolicitud.MEDIA, 48, Set.of(Rol.ALUMNO)),
    VINCULO_APODERADO("Vincular a mi hijo o hija", "Que la academia vincule a un alumno con mi cuenta de apoderado.",
            PrioridadSolicitud.MEDIA, 48, Set.of(Rol.APODERADO)),
    SOPORTE_TECNICO("Soporte técnico", "Errores de la plataforma, videos que no cargan o pantallas que no responden.",
            PrioridadSolicitud.ALTA, 8, Set.of(Rol.ALUMNO, Rol.APODERADO));

    private final String nombre;
    private final String descripcion;
    private final PrioridadSolicitud prioridad;
    private final int horasSla;
    private final Set<String> roles;

    TipoSolicitud(String nombre, String descripcion, PrioridadSolicitud prioridad, int horasSla, Set<String> roles) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.horasSla = horasSla;
        this.roles = roles;
    }

    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public PrioridadSolicitud getPrioridad() { return prioridad; }
    public int getHorasSla() { return horasSla; }
    public Set<String> getRoles() { return roles; }

    public boolean permitidoPara(String rol) {
        return roles.contains(rol);
    }
}
