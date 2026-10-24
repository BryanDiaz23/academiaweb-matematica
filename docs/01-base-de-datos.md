# 2. Integración con Base de Datos

## 2.1 Modelo Entidad-Relación

```mermaid
erDiagram
    ROLES ||--o{ USUARIOS : "asigna"
    USUARIOS ||--o{ MATRICULAS : "solicita"
    NIVELES ||--o{ MATRICULAS : "pertenece"
    HORARIOS ||--o{ MATRICULAS : "en turno"
    NIVELES ||--o{ NIVEL_CARACTERISTICAS : "describe"
    NIVELES ||--o{ CLASES_GRABADAS : "agrupa"
    USUARIOS |o--o{ CLASES_GRABADAS : "publica"
    NIVELES |o--o{ SOLICITUDES_INFORMACION : "interés"
    USUARIOS |o--o{ AUDITORIA_ACCESOS : "genera"
    USUARIOS ||--o{ VINCULOS_APODERADO : "es apoderado"
    USUARIOS ||--o{ VINCULOS_APODERADO : "es alumno"

    ROLES {
        bigint id PK
        varchar nombre UK "ADMIN | ALUMNO | APODERADO"
        varchar descripcion
    }
    USUARIOS {
        bigint id PK
        varchar nombre_completo
        varchar username UK
        varchar email UK
        varchar password_hash "BCrypt costo 12"
        bigint rol_id FK
        boolean activo
        int intentos_fallidos
        timestamp bloqueado_hasta
        timestamp ultimo_acceso
        timestamp creado_en
        timestamp actualizado_en
    }
    NIVELES {
        bigint id PK
        varchar codigo UK "PRIMARIA | SECUNDARIA | PRE"
        varchar nombre
        varchar subtitulo
        varchar rango_edad
        numeric precio_mensual "CHECK >= 0"
        boolean destacado
        int orden
        boolean activo
    }
    NIVEL_CARACTERISTICAS {
        bigint id PK
        bigint nivel_id FK "ON DELETE CASCADE"
        varchar descripcion
        int orden
    }
    HORARIOS {
        bigint id PK
        varchar turno UK
        time hora_inicio
        time hora_fin "CHECK fin > inicio"
        varchar dias
    }
    CLASES_GRABADAS {
        bigint id PK
        varchar titulo
        varchar descripcion
        bigint nivel_id FK
        int duracion_minutos "CHECK > 0"
        date fecha_clase
        varchar url_video
        varchar url_pizarra
        boolean publicada
        bigint creado_por FK "ON DELETE SET NULL"
        timestamp creado_en
    }
    MATRICULAS {
        bigint id PK
        bigint usuario_id FK "ON DELETE CASCADE"
        bigint nivel_id FK
        bigint horario_id FK
        varchar estado "CHECK PENDIENTE|ACTIVA|VENCIDA|ANULADA"
        date fecha_inicio
        date fecha_fin "CHECK fin >= inicio"
        timestamp creado_en
        timestamp actualizado_en
    }
    SOLICITUDES_INFORMACION {
        bigint id PK
        varchar nombre
        varchar telefono
        varchar email
        bigint nivel_id FK "ON DELETE SET NULL"
        varchar mensaje
        boolean atendida
        timestamp creado_en
    }
    AUDITORIA_ACCESOS {
        bigint id PK
        bigint usuario_id FK "ON DELETE SET NULL"
        varchar identificador
        varchar evento
        varchar detalle
        varchar ip
        timestamp creado_en
    }
    VINCULOS_APODERADO {
        bigint id PK
        bigint apoderado_id FK "rol APODERADO"
        bigint alumno_id FK "rol ALUMNO"
        varchar parentesco "PADRE | MADRE | TUTOR | APODERADO"
        bigint creado_por FK "administrador"
        timestamp creado_en
    }
```

**Relación clave del negocio:** un apoderado solo ve el avance de los alumnos con los que el administrador lo vinculó en `VINCULOS_APODERADO`. Y un alumno solo accede a las clases grabadas de un nivel si existe una fila en `MATRICULAS` con `estado = 'ACTIVA'` para ese `usuario_id` y `nivel_id`.

## 2.2 Esquema físico y diccionario de datos

| Tabla | Propósito | Restricciones destacadas |
|-------|-----------|--------------------------|
| `roles` | Perfiles de autorización | `uq_roles_nombre` |
| `usuarios` | Cuentas del sistema | `uq_usuarios_username`, `uq_usuarios_email`, `fk_usuarios_rol`, `ck_usuarios_intentos` |
| `niveles` | Programas académicos y precio mensual | `uq_niveles_codigo`, `ck_niveles_precio` |
| `nivel_caracteristicas` | Beneficios por nivel (1:N) | `fk_caracteristicas_nivel` con `ON DELETE CASCADE` |
| `horarios` | Turnos de clase en vivo | `uq_horarios_turno`, `ck_horarios_rango` |
| `clases_grabadas` | Sesiones grabadas con enlaces de video y pizarra | `fk_clases_nivel`, `fk_clases_creador`, `ck_clases_duracion` |
| `matriculas` | Alumno + nivel + horario + estado | 3 FK, `ck_matriculas_estado`, `ck_matriculas_fechas` |
| `solicitudes_informacion` | Formulario público de diagnóstico | `fk_solicitudes_nivel` con `ON DELETE SET NULL` |
| `auditoria_accesos` | Bitácora de eventos de seguridad | `fk_auditoria_usuario`, índice por fecha |
| `progreso_clases` | Clases vistas y favoritas de cada alumno (V4) | `uq_progreso_usuario_clase`, 2 FK con `ON DELETE CASCADE` |
| `vinculos_apoderado` | Qué apoderado puede ver el avance de qué alumno (V5); lo crea solo el administrador | `uq_vinculo_apoderado_alumno`, `ck_vinculo_distintos`, `ck_vinculo_parentesco`, 3 FK |

Índices sobre las claves foráneas más consultadas: `idx_usuarios_rol`, `idx_caracteristicas_nivel`, `idx_clases_nivel`, `idx_clases_fecha`, `idx_matriculas_usuario`, `idx_matriculas_nivel`, `idx_auditoria_fecha`.

## 2.3 Scripts de creación y poblado

Los scripts son migraciones **Flyway** que se ejecutan automáticamente al arrancar la API, en orden y una sola vez (Flyway registra cada versión en la tabla `flyway_schema_history`):

| Script | Contenido |
|--------|-----------|
| [`V1__esquema_inicial.sql`](../backend/src/main/resources/db/migration/V1__esquema_inicial.sql) | 9 tablas, llaves primarias `IDENTITY`, 9 llaves foráneas con nombre, restricciones `UNIQUE` y `CHECK`, 7 índices |
| [`V3__mejoras_seguridad.sql`](../backend/src/main/resources/db/migration/V3__mejoras_seguridad.sql) | Columna `debe_cambiar_password` en usuarios e índice `idx_matriculas_estado_fin` para el vencimiento diario |
| [`V4__progreso_clases.sql`](../backend/src/main/resources/db/migration/V4__progreso_clases.sql) | Tabla `progreso_clases` (vista, favorita y última vez que el alumno abrió cada clase) |
| [`V5__rol_apoderado.sql`](../backend/src/main/resources/db/migration/V5__rol_apoderado.sql) | Rol `APODERADO` y tabla `vinculos_apoderado` (apoderado ↔ alumno, con parentesco, quién lo creó y cuándo) |
| [`V2__datos_iniciales.sql`](../backend/src/main/resources/db/migration/V2__datos_iniciales.sql) | 2 roles, 2 usuarios (administrador Bryan Díaz y alumno demo, con hash BCrypt), 3 niveles con 12 características, 3 horarios, 6 clases grabadas, 1 matrícula activa y 1 solicitud |

Los datos semilla resuelven las llaves foráneas con subconsultas por clave natural (`codigo`, `nombre`, `username`), no con IDs fijos, para que el script sea portable entre motores.

Los scripts fueron verificados en **PostgreSQL 16** (motor de producción) y son compatibles con **H2 en modo PostgreSQL**, que se usa en desarrollo y en las pruebas automatizadas.

## 2.4 Buenas prácticas aplicadas

| Práctica | Evidencia |
|----------|-----------|
| ORM Hibernate/JPA | Entidades en `entity/` con `@Entity`, `@ManyToOne`, `@OneToMany`, `@Enumerated(STRING)` |
| Consultas parametrizadas | Repositorios Spring Data con consultas derivadas y JPQL con parámetros nombrados (`ClaseGrabadaRepository.buscarParaAlumno` usa `:usuarioId`, `:estado`, `:texto`). No existe SQL concatenado en el código. |
| Esquema versionado | Flyway (V1, V2). `spring.jpa.hibernate.ddl-auto=none`: Hibernate nunca altera el esquema en producción. |
| Integridad referencial | FK con reglas `CASCADE` / `SET NULL` según el caso y `CHECK` para reglas de dominio |
| Transacciones | `@Transactional` en servicios; `readOnly = true` en lecturas; `noRollbackFor` en login para persistir contadores de intentos fallidos |
| Sin datos sensibles en claro | Contraseñas solo como hash BCrypt; secretos (JWT, credenciales de BD) por variables de entorno |
| Separación de entornos | Perfil `dev` (H2 en memoria) y `prod` (PostgreSQL gestionado), `open-in-view=false` |
| Pool de conexiones | HikariCP con `maximum-pool-size: 5` en producción |
