# Matemática Sin Estrés — Academia Virtual

Plataforma web de refuerzo en matemática para Primaria, Secundaria y Preuniversitario. Los alumnos se registran, solicitan su matrícula y acceden a las clases grabadas de su nivel. El administrador gestiona matrículas, clases, usuarios y la seguridad desde un panel.

> **Curso Integrador II: Sistemas (UTP) — Avance de Proyecto Final 3 (APF3) · versión 2.0.0**
> Gestión del servicio: mesa de ayuda con SLA (solicitudes de servicio), control de cambios ITIL 4 / ISO/IEC 20000-1 en GitHub,
> plan de capacidad con pruebas de carga y despliegue de la versión final. Ver [CHANGELOG.md](CHANGELOG.md).

---

## Arquitectura

```mermaid
flowchart LR
    U[Usuario<br/>navegador] -->|HTTPS| FE[Front-end<br/>React 18 + Vite + Tailwind<br/>Render Static Site]
    FE -->|REST JSON<br/>Authorization: Bearer JWT| BE[Back-end<br/>Spring Boot 3 · Spring Security<br/>Docker en Render]
    BE -->|JPA / Hibernate<br/>consultas parametrizadas| DB[(PostgreSQL 16<br/>Render)]
    BE -.->|migraciones versionadas| FW[Flyway<br/>V1 esquema · V2 seed]
```

| Capa | Tecnología |
|------|------------|
| Front-end | React 18, React Router 6, Tailwind CSS 3, Vite 5, lucide-react |
| Back-end | Java 17, Spring Boot 3.3, Spring Web, Spring Security 6, Bean Validation |
| Persistencia | Spring Data JPA (Hibernate 6), Flyway, PostgreSQL 16 (prod) / H2 (dev y pruebas) |
| Seguridad | JWT HS256+ (jjwt 0.12), BCrypt costo 12, CORS restringido, CSP y cabeceras seguras |
| Pruebas | JUnit 5, Mockito, MockMvc, AssertJ (139 pruebas en el back-end, cobertura 84.8 %), `node:test` (74 en el front-end), Playwright (E2E), JaCoCo (cobertura), Postman (42 peticiones con aserciones de status y SLA < 500 ms) |
| Despliegue | Docker multi-etapa, Render Blueprint (`render.yaml`), GitHub Actions (CI) |

## Estructura del repositorio

```
├── backend/                  API REST Spring Boot
│   ├── src/main/java/pe/matematicasinestres/api/
│   │   ├── config/           SecurityConfig (JWT stateless, roles, CORS, cabeceras)
│   │   ├── security/         JwtService, filtro JWT, PasswordPolicy, manejadores 401/403
│   │   ├── entity/           Entidades JPA (11 tablas)
│   │   ├── repository/       Repositorios Spring Data (consultas parametrizadas)
│   │   ├── service/          Lógica de negocio (auth, matrículas, clases, auditoría)
│   │   ├── web/              Controladores REST (público, auth, alumno, apoderado, admin)
│   │   ├── dto/              Objetos de entrada/salida con Bean Validation
│   │   ├── validation/       @SinHtml (anti-XSS)
│   │   └── exception/        Manejo global de errores (sin fuga de stacktrace)
│   ├── src/main/resources/db/migration/   V1 esquema · V2 datos iniciales · V3 mejoras de seguridad · V4 progreso de clases · V5 rol apoderado y vínculos · V6 mesa de ayuda
│   ├── src/test/             Pruebas unitarias y de integración
│   └── Dockerfile
├── frontend/                 SPA React (Home, Login, Registro, Aula Virtual, Panel Admin)
├── e2e/                      Pruebas de sistema en navegador (Playwright)
├── postman/                  Colección y entornos de Postman
├── docs/                     Documentación técnica (APF2 y APF3) y registro de RFC (docs/rfc/)
├── scripts/                  health-check, rollback, respaldo de BD y etiquetas de GitHub
├── capacidad/                Pruebas de carga (Python y k6) y resultados
├── .github/                  CI, control de cambios, release, verificación de producción, plantillas RFC/PR, CODEOWNERS
├── CHANGELOG.md              Registro de cambios por versión
├── docker-compose.yml        Entorno local con PostgreSQL
└── render.yaml               Despliegue en la nube (BD + back-end + front-end)
```

## Funcionalidades

| Rol | Funcionalidad |
|-----|---------------|
| Visitante | Ver niveles, precios y horarios (desde la BD) · últimas clases grabadas (sin enlaces) · solicitar clase de diagnóstico · registrarse |
| Alumno | Iniciar sesión · ver sus matrículas · solicitar matrícula · ver y buscar clases grabadas **solo de los niveles con matrícula activa y vigente** · cambiar contraseña |
| Apoderado (padre, madre o tutor) | Registrarse como apoderado · ver **solo a los hijos que el administrador le vincule** · informe de avance (porcentaje, clases vistas, minutos, última actividad, avance por nivel y por semana, alertas) · imprimir o guardar en PDF y descargar CSV · cambiar contraseña |
| Administrador | Resumen del sistema · activar, renovar o anular matrículas · CRUD de clases grabadas · activar/desactivar y desbloquear usuarios · **restablecer contraseñas** (contraseña temporal con cambio obligatorio) · buscar y filtrar · atender solicitudes · bitácora de auditoría |

### Versión 2.0.0 (APF3: gestión del servicio)

- **Mesa de ayuda** (*Aula › Mesa de ayuda*, *Familia › Mesa de ayuda*, *Admin › Mesa de ayuda*): catálogo de 6 solicitudes de servicio
  (información, acceso, restablecer contraseña, cambio de turno, vínculo de apoderado y soporte técnico) con prioridad y SLA de 4 a 48 h.
  El usuario sigue su solicitud y confirma el cierre; el administrador atiende una cola ordenada por prioridad y vencimiento,
  con indicadores de cumplimiento del SLA. Migración **V6**, 16 pruebas nuevas en el back-end y 7 en el front-end.
- **Versión desplegada:** `GET /api/public/version` y campo `version` en el health check para validar cada despliegue.
- **Control de cambios:** plantillas de RFC (estándar, normal, emergencia), plantilla de PR, CODEOWNERS y workflows
  *Control de cambios*, *Release* y *Verificación de producción*. Procedimiento completo en [docs/10](docs/10-gestion-del-cambio.md).
- **Plan de reversión:** `scripts/rollback.sh <etiqueta>`, `scripts/health-check.sh <url> [versión]` y `scripts/respaldo-bd.sh`.
- **Capacidad:** `python3 capacidad/carga.py --url http://localhost:8080 --escalones 1,5,10,25,50` (resultados en [docs/11](docs/11-capacidad-y-rendimiento.md)).

### Mejoras de la versión 1.5 (portal de padres)

- **Nuevo rol `APODERADO`**: se crea desde el registro (*Soy padre, madre o apoderado*, o `/register?tipo=apoderado`). El rol ADMIN nunca se puede pedir por registro.
- **Vínculos hechos por el administrador** (Panel › Familias): asocia un apoderado con un alumno y su parentesco (padre, madre, tutor, apoderado). Sin vínculo, el apoderado no ve nada.
- **Panel de Familia** (`/familia`): lista de hijos con estado (al día, completado, sin actividad, pendiente…) y un informe detallado con anillo de avance, 4 indicadores, gráfico de las últimas 6 semanas, avance por nivel, lista de clases vistas y matrículas. Calcula el avance con las mismas reglas que ve el alumno.
- **Informe**: botón de imprimir/guardar PDF, descarga CSV y mensajes de WhatsApp para renovar o contactar.
- **Seguridad**: el informe del apoderado no incluye enlaces de video ni pizarra; un alumno inexistente y uno no vinculado reciben el mismo 403 (protección IDOR); toda creación o eliminación de vínculo queda en la auditoría.
- **Admin**: pestaña Familias, botón *Avance* por alumno en Usuarios y filtro de apoderados.
- **Página principal y asistente**: sección *Para padres* y una intención nueva en el chat (*padres / progreso*).
- Migración Flyway **V5** (`vinculos_apoderado`) y 10 pruebas de integración (APO-01…10), 12 unitarias del front (FAM-01…12) y el caso E2E-08.
- Para probarlo: registra una cuenta como apoderado, entra como administrador y vincúlala a un alumno en *Admin › Familias*. No se crea ningún apoderado de demostración (evita una contraseña conocida en producción).

### Mejoras de la versión 1.1

- **Vencimiento automático de matrículas:** el acceso a las clases se corta el día en que vence la matrícula, y una tarea diaria (00:05, hora de Lima) la marca como VENCIDA. Al reactivarla se renueva por un mes.
- **Restablecer contraseña desde el panel:** el administrador genera una contraseña temporal segura; el usuario está obligado a cambiarla en su siguiente ingreso (la API responde 403 `CAMBIO_PASSWORD_REQUERIDO` hasta que lo haga).
- **Límite de intentos por IP:** login (10/min), registro (5/min) y solicitudes públicas (5/min) responden **429 Too Many Requests** al superarse.
- **Página principal con datos reales:** las cifras salen de la base de datos (`/api/public/estadisticas`) y la sección de testimonios se reemplazó por "¿Cómo funciona?".
- **Panel de administración:** búsqueda de usuarios y matrículas, filtro por estado y renovación de matrículas vencidas.

### Mejoras de la versión 1.2 (Aula del alumno y Panel de administración)

**Alumno**
- Aula con barra lateral: *Inicio, Mis clases, Matrículas, Horarios y Mi cuenta*.
- Inicio con progreso (anillo y % de clases vistas), "Continuar viendo", próxima clase en vivo, avance por nivel, últimas clases y favoritas.
- Clases: marcar como **vista** o **favorita**, búsqueda sin tildes, filtros (por ver / vistas / favoritas / nivel), orden, vista en cuadrícula o lista, insignia "Nueva".
- Avisos de vigencia (vence en ≤ 7 días, vencida, pendiente) con botón de renovación por WhatsApp.
- Horarios con descarga de recordatorio semanal `.ics` para el calendario.
- Solicitud de matrícula con resumen del nivel y el precio.

**Administrador**
- Resumen con ingreso mensual estimado, bloque "Requiere tu atención", gráficos (estado de matrículas, alumnos por nivel, crecimiento 6 meses, accesos 7 días), clases más vistas y próximas a vencer.
- Tablas con búsqueda, filtros por estado, orden por columna, paginación y **exportación a CSV** (protegida contra inyección de fórmulas).
- Matrículas: alta manual (`POST /api/admin/matriculas`), extender +1 mes, renovar, anular con confirmación.
- Clases: formulario en ventana con validación, interruptor publicar/ocultar, duplicar y contador de vistas/favoritos por clase.
- Usuarios: ficha con matrículas y actividad, contraseña temporal con mensaje listo para enviar.
- Solicitudes con botón de WhatsApp con mensaje prellenado; Auditoría con filtros por evento y rango.
- Nuevos endpoints del alumno: `POST /api/alumno/clases/{id}/abrir` y `PUT /api/alumno/clases/{id}/progreso`; migración Flyway **V4** (`progreso_clases`).

### Mejoras de la versión 1.3 (calidad y pruebas)

- **Plan de pruebas y requisitos de calidad:** 34 requisitos no funcionales según ISO/IEC 25010, plan de pruebas con niveles, tipos, criterios y trazabilidad, diagramas de componentes y despliegue, y guía de Scrum y usabilidad (ver la tabla de documentación).
- **Pruebas nuevas:** humo, rendimiento (carga y estrés), seguridad con payloads de inyección SQL y XSS, JWT, generador de contraseñas, front-end (`node:test`) y de sistema en navegador (Playwright, escritorio y móvil).
- **Integración continua:** GitHub Actions ejecuta primero las pruebas de humo, luego la suite completa con informe de cobertura JaCoCo, el front-end y las pruebas E2E. Dependabot vigila las dependencias.
- **Defecto corregido (DEF-001):** un `Content-Type` no soportado devolvía 500; ahora responde **415** (y **406** si el cliente pide otro formato).
- **Asistente de preguntas frecuentes:** el botón flotante de WhatsApp se reemplazó por un chat que responde al instante (precios y horarios salen de la base de datos) y deriva a WhatsApp lo que no entiende. Las respuestas se editan en `frontend/src/utils/chatbot.js`.
- **Seguridad y operación:** cabecera `Permissions-Policy`, apagado ordenado (*graceful shutdown*) y compresión de respuestas JSON.
- **Front-end:** carga diferida de pantallas (`React.lazy`), pantalla de error global (`ErrorBoundary`), respeto de `prefers-reduced-motion`, favicon, metadatos Open Graph y `robots.txt`.

### Cuentas iniciales (seed)

| Usuario | Rol | Uso |
|---------|-----|-----|
| `bryandiaz` (Bryan Díaz) | ADMIN | Administración de la plataforma |
| `alumno.demo` | ALUMNO | Demostración y pruebas de control de acceso (matrícula activa en Secundaria) |

Las contraseñas **no están en el repositorio**: solo se guarda su hash BCrypt en `V2__datos_iniciales.sql`. Se entregan por un canal privado y se recomienda cambiarlas desde *Mi cuenta* después del primer ingreso en producción.

### Política de contraseñas

Se aplica en el servidor (`PasswordPolicy.java`) y se replica en el registro para guiar al usuario en tiempo real:

- De 12 a 64 caracteres, con mayúscula, minúscula, número y símbolo; sin espacios.
- Sin 3 caracteres iguales seguidos (`aaa`) ni secuencias (`1234`, `abcd`, `4321`).
- Sin palabras comunes (`password`, `qwerty`, `123456`, `admin`…).
- Sin el nombre, usuario o correo del propio usuario.

## Ejecución local

**Requisitos:** Java 17+, Maven 3.9+, Node.js 20+.

```bash
# 1) Back-end (perfil dev: H2 en memoria; Flyway crea tablas y datos)
cd backend
mvn spring-boot:run            # http://localhost:8080/api/public/health

# 2) Front-end (en otra terminal)
cd frontend
cp .env.example .env           # VITE_API_URL=http://localhost:8080
npm install
npm run dev                    # http://localhost:5173

# 3) Pruebas automatizadas del back-end
cd backend
mvn test                          # todas
mvn test -Dgroups=humo            # también: unitaria · rendimiento · seguridad
mvn verify                        # pruebas + informe de cobertura en target/site/jacoco

# 4) Pruebas unitarias del front-end
cd frontend
npm test

# 5) Pruebas de sistema en navegador (Playwright; levanta la API y el front-end solo)
cd e2e
npm install && npx playwright install chromium
npx playwright test               # informe: npx playwright show-report
```

**Con PostgreSQL en Docker** (mismo motor que producción):

```bash
JWT_SECRET=$(openssl rand -base64 32) docker compose up --build
```

## Endpoints principales

| Método | Ruta | Acceso | Respuestas |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | 200 · 400 · 401 · 403 · 423 · 429 |
| POST | `/api/auth/register` | Público | 201 · 400 · 409 · 429 |
| GET | `/api/auth/me` | Autenticado | 200 · 401 |
| PUT | `/api/auth/password` | Autenticado | 200 · 400 · 401 |
| GET | `/api/public/niveles` · `/horarios` · `/clases-recientes` · `/estadisticas` · `/health` | Público | 200 |
| POST | `/api/public/solicitudes` | Público | 201 · 400 · 429 |
| GET/POST | `/api/alumno/matriculas` | ALUMNO | 200/201 · 401 · 403 · 404 · 409 |
| GET | `/api/alumno/clases?buscar=` | ALUMNO | 200 · 401 · 403 |
| GET | `/api/alumno/clases/{id}` | ALUMNO | 200 · 400 · 403 · 404 |
| GET | `/api/apoderado/hijos` · `/api/apoderado/hijos/{alumnoId}/avance` | APODERADO | 200 · 401 · 403 |
| GET/POST/DELETE | `/api/admin/vinculos[/{id}]` · GET `/api/admin/alumnos/{id}/avance` | ADMIN | 200/201/204 · 400 · 404 · 409 |
| GET | `/api/admin/resumen` · `/usuarios` · `/matriculas` · `/clases` · `/solicitudes` · `/auditoria` | ADMIN | 200 · 401 · 403 |
| PATCH | `/api/admin/usuarios/{id}/estado` · `/usuarios/{id}/desbloquear` · `/matriculas/{id}` · `/solicitudes/{id}/atendida` | ADMIN | 200 · 400 · 404 |
| PATCH | `/api/admin/usuarios/{id}/restablecer-password` | ADMIN | 200 (contraseña temporal) · 400 · 403 · 404 |
| GET | `/api/public/version` · `/api/public/catalogo-servicios` | Público | 200 |
| GET/POST | `/api/mesa-ayuda/solicitudes` · GET `/api/mesa-ayuda/catalogo` | ALUMNO, APODERADO | 200/201 · 400 · 401 · 403 · 409 · 429 |
| PATCH | `/api/mesa-ayuda/solicitudes/{id}/cerrar` | ALUMNO, APODERADO | 200 · 404 · 409 |
| GET/PATCH | `/api/admin/mesa-ayuda[/{id}]` · GET `/api/admin/mesa-ayuda/metricas` | ADMIN | 200 · 400 · 404 · 409 |
| POST/PUT/DELETE | `/api/admin/clases[/{id}]` | ADMIN | 201/200/204 · 400 · 404 |

## Documentación del APF2

| Apartado | Documento |
|----------|-----------|
| 2. Integración con base de datos | [docs/01-base-de-datos.md](docs/01-base-de-datos.md) |
| 3. Controles de seguridad | [docs/02-seguridad.md](docs/02-seguridad.md) |
| 4. Validación del servicio | [docs/03-pruebas.md](docs/03-pruebas.md) · [postman/](postman) |
| 5. Despliegue a producción | [docs/04-despliegue.md](docs/04-despliegue.md) |
| 6. Requisitos no funcionales (ISO/IEC 25010) | [docs/05-requisitos-no-funcionales.md](docs/05-requisitos-no-funcionales.md) |
| 7. Plan de pruebas de software | [docs/06-plan-de-pruebas.md](docs/06-plan-de-pruebas.md) |
| 8. Diagramas de componentes y de despliegue | [docs/07-arquitectura-componentes-despliegue.md](docs/07-arquitectura-componentes-despliegue.md) |
| 9. Scrum, prototipo y usabilidad | [docs/08-scrum-y-prototipos.md](docs/08-scrum-y-prototipos.md) |

## Documentación del APF3

| Apartado | Documento |
|----------|-----------|
| 3. Gestión de solicitudes de servicio | [docs/09-gestion-de-solicitudes.md](docs/09-gestion-de-solicitudes.md) |
| 4. Gestión del cambio (flujo RFC, matriz, backout, CI) | [docs/10-gestion-del-cambio.md](docs/10-gestion-del-cambio.md) · [registro de RFC](docs/rfc/registro.md) |
| 5. Capacidad y rendimiento | [docs/11-capacidad-y-rendimiento.md](docs/11-capacidad-y-rendimiento.md) · [capacidad/](capacidad) |
| 6. Despliegue de la versión final y notas de versión | [docs/12-despliegue-version-final.md](docs/12-despliegue-version-final.md) · [CHANGELOG.md](CHANGELOG.md) |

## Enlaces del proyecto

- **Repositorio:** https://github.com/BryanDiaz23/matematica-sin-estres2
- **Front-end en producción:** _completar tras el despliegue_ (p. ej. `https://mse-frontend.onrender.com`)
- **API en producción:** _completar tras el despliegue_ (p. ej. `https://mse-backend.onrender.com/api/public/health`)
