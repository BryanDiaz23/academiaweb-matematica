# Registro de cambios (CHANGELOG)

Todos los cambios relevantes del proyecto se registran aquí, según [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el [versionado semántico](https://semver.org/lang/es/) (MAYOR.MENOR.PARCHE).

Cada entrada debe tener su RFC (issue de GitHub) aprobado según el procedimiento de
[gestión del cambio](docs/10-gestion-del-cambio.md). El workflow *Control de cambios* rechaza los pull requests
hacia `main` que no actualizan este archivo, y el workflow *Release* publica la sección de cada versión como notas de la release.

## [Sin publicar]

## [2.0.0] - 2026-10-23

Versión final del APF3: gestión del servicio (solicitudes, cambios y capacidad).

### Agregado
- **Mesa de ayuda** (RFC-2026-001): alumnos y apoderados registran solicitudes de servicio desde la plataforma
  (información, acceso a la cuenta o a una clase, restablecer contraseña, cambio de turno, vínculo de apoderado y soporte técnico).
  Cada tipo tiene prioridad y SLA propios (de 4 h a 48 h); el estado del SLA se calcula en línea
  (en plazo, por vencer, vencida, cumplida, fuera de plazo).
- Panel *Admin › Mesa de ayuda*: cola ordenada por prioridad y vencimiento, atención con respuesta obligatoria al resolver
  o rechazar, indicadores (pendientes, por vencer, cumplimiento del SLA, tiempo medio de resolución) y exportación CSV.
- Alerta en el *Resumen* del administrador cuando una solicitud está por vencer su SLA.
- Endpoints `GET /api/public/catalogo-servicios`, `GET|POST /api/mesa-ayuda/solicitudes`, `GET /api/mesa-ayuda/catalogo`,
  `PATCH /api/mesa-ayuda/solicitudes/{id}/cerrar`, `GET /api/admin/mesa-ayuda`, `GET /api/admin/mesa-ayuda/metricas`
  y `PATCH /api/admin/mesa-ayuda/{id}`.
- Migración Flyway **V6** (`solicitudes_servicio`), compatible con la versión anterior.
- **Versión desplegada** (RFC-2026-002): `GET /api/public/version` (versión, commit y fecha de compilación) y campo `version`
  en el health check, para validar cada despliegue.
- **Control de cambios en GitHub** (RFC-2026-003): plantillas de RFC estándar, normal y de emergencia, plantilla de pull request,
  CODEOWNERS, workflows *Control de cambios*, *Release* y *Verificación de producción*, y scripts `health-check.sh`,
  `rollback.sh`, `respaldo-bd.sh` y `crear-etiquetas.sh`.
- **Capacidad y rendimiento** (RFC-2026-004): prueba de carga `capacidad/carga.py` (y `k6-carga.js`) con escalones de usuarios concurrentes.
- 16 pruebas nuevas del back-end (MDA-01…10, VER-01, SLA-01…05) y 7 del front-end (MDA-F01…F07).
- Documentación: gestión de solicitudes, gestión del cambio, capacidad y rendimiento, y despliegue de la versión final (docs/09 a 12).

### Cambiado
- El CI también se ejecuta en las ramas `develop` y `apf3`.
- Límite de peticiones por IP también en el registro de solicitudes de la mesa de ayuda (5 por minuto).
- La auditoría registra los eventos `SOLICITUD_CREADA` y `SOLICITUD_ACTUALIZADA`.

## [1.5.0]

### Agregado
- Portal de padres: rol `APODERADO`, vínculos creados por el administrador, panel de familia con informe de avance,
  impresión en PDF y descarga CSV. Migración V5.

## [1.3.0]

### Agregado
- Plan de pruebas y 34 requisitos no funcionales (ISO/IEC 25010), pruebas de humo, rendimiento, seguridad, front-end y E2E.
- Integración continua en GitHub Actions con cobertura JaCoCo y Dependabot.
- Asistente de preguntas frecuentes en lugar del botón de WhatsApp.

### Corregido
- DEF-001: un `Content-Type` no soportado devolvía 500; ahora responde 415 (y 406 si el cliente pide otro formato).

## [1.2.0]

### Agregado
- Aula del alumno con progreso, clases vistas y favoritas; panel de administración con gráficos, filtros y exportación CSV.
  Migración V4 (`progreso_clases`).

## [1.1.0]

### Agregado
- Vencimiento automático de matrículas, contraseña temporal desde el panel, límite de intentos por IP (429)
  y cifras reales en la página principal. Migración V3.

## [1.0.0]

### Agregado
- Versión 1 desplegable (APF2): base de datos PostgreSQL con Flyway, autenticación JWT, contraseñas BCrypt,
  controles OWASP Top 10, aula virtual, panel de administración y despliegue en Render.

> Las fechas de las versiones 1.x figuran en el historial de commits del repositorio.
