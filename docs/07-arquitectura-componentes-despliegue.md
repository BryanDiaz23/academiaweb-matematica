# 8. Diagramas de Componentes y de Despliegue

Los diagramas están escritos en **Mermaid**, así que GitHub los dibuja automáticamente. Para llevarlos al informe o a las diapositivas, copia el bloque en <https://mermaid.live> y exporta como PNG o SVG.

## 8.1 Notación usada

Siguiendo la notación UML que se enseña en el curso:

| Elemento | UML | Cómo se dibuja aquí |
|----------|-----|---------------------|
| **Componente** | Rectángulo con dos rectángulos pequeños en el lado izquierdo; es una parte modular del sistema cuyo funcionamiento interno es invisible para el entorno | Caja con el estereotipo `«component»` |
| **Interfaz** | Círculo pequeño unido por una línea continua al componente que la **provee** | Círculo (`(( ))`) unido con `---` al componente |
| **Dependencia** | Línea discontinua con flecha hacia el componente o la interfaz que **provee** el servicio | Flecha discontinua `-.->` |
| **Nodo** (despliegue) | Cubo: recurso de ejecución (computadora, dispositivo, memoria) | Recuadro con estereotipo `«node»`, `«device»` o `«execution environment»` |
| **Artefacto** | Archivo físico que se instala en un nodo | `«artifact»` dentro del nodo |
| **Conexión** (despliegue) | Línea entre nodos con el protocolo | Flecha con el protocolo y el puerto |

---

## 8.2 Diagrama de componentes — visión general del sistema

```mermaid
flowchart LR
    subgraph CLI["Cliente"]
        SPA["«component»<br/>SPA React 18<br/>Home · Login · Registro · Aula · Panel de Familia · Panel Admin"]
    end
    subgraph APP["Servidor de aplicación"]
        API["«component»<br/>API REST<br/>Spring Boot 3"]
        MIG["«component»<br/>Migraciones<br/>Flyway V1–V4"]
    end
    DB[("«component»<br/>PostgreSQL 16<br/>(H2 en desarrollo)")]
    WA["«external»<br/>WhatsApp<br/>enlaces wa.me"]
    VID["«external»<br/>Alojamiento de videos<br/>enlaces https"]

    iREST(("API REST<br/>JSON + JWT"))
    iSQL(("JDBC<br/>SQL"))

    API --- iREST
    DB --- iSQL
    SPA -.->|requiere| iREST
    API -.->|requiere| iSQL
    MIG -.->|requiere| iSQL
    SPA -.->|abre enlace| WA
    SPA -.->|abre enlace| VID
```

| Componente | Responsabilidad | Interfaz que provee | Interfaz que requiere |
|------------|-----------------|---------------------|-----------------------|
| SPA React | Presentación, navegación por rol, validación inmediata en el navegador | — | API REST |
| API REST | Autenticación, reglas de negocio, autorización, auditoría | API REST (JSON + JWT) | JDBC/SQL |
| Flyway | Crear y versionar el esquema y los datos iniciales al arrancar | — | JDBC/SQL |
| PostgreSQL | Persistencia (11 tablas: 9 de V1 + `progreso_clases` de V4 + `vinculos_apoderado` de V5) | JDBC/SQL | — |

## 8.3 Componentes internos del back-end

Las dependencias salen del código (constructores de los controladores y servicios). Los filtros de seguridad se ejecutan **antes** que los controladores en cada petición.

```mermaid
flowchart TB
    subgraph SEG["Seguridad"]
        RL["«component»<br/>RateLimitFilter"]
        JF["«component»<br/>JwtAuthenticationFilter"]
        UDS["«component»<br/>UsuarioDetailsService"]
        JWT["«component»<br/>JwtService"]
        POL["«component»<br/>PasswordPolicy"]
        GEN["«component»<br/>GeneradorPassword"]
    end
    subgraph WEB["Capa web — controladores REST"]
        CP["PublicController<br/>/api/public"]
        CA["AuthController<br/>/api/auth"]
        CAL["AlumnoController<br/>/api/alumno"]
        CAD["AdminController<br/>/api/admin"]
        CAP["ApoderadoController<br/>/api/apoderado"]
        EXC["GlobalExceptionHandler<br/>errores JSON"]
    end
    subgraph SVC["Capa de servicios"]
        SC["CatalogoService"]
        SA["AuthService"]
        SM["MatriculaService"]
        SCL["ClaseService"]
        SAD["AdminService"]
        SAP["ApoderadoService<br/>vínculos y avance"]
        SAU["AuditoriaService"]
        SV["VencimientoMatriculasService<br/>tarea diaria 00:05"]
    end
    subgraph DATA["Persistencia"]
        REPO["Repositorios Spring Data JPA<br/>10 repositorios"]
        DB[("PostgreSQL / H2")]
        FW["Flyway"]
    end

    JF -.-> JWT
    JF -.-> UDS
    UDS -.-> REPO
    CP -.-> SC
    CA -.-> SA
    CAL -.-> SM
    CAL -.-> SCL
    CAD -.-> SAD
    CAD -.-> SCL
    CAD -.-> SM
    SA -.-> JWT
    SA -.-> POL
    SA -.-> SAU
    SAD -.-> GEN
    SAD -.-> SAU
    GEN -.-> POL
    SC -.-> REPO
    SA -.-> REPO
    SM -.-> REPO
    SCL -.-> REPO
    SAD -.-> REPO
    SAU -.-> REPO
    SV -.-> REPO
    REPO -.-> DB
    FW -.-> DB
```

| Capa | Componentes | Responsabilidad |
|------|-------------|-----------------|
| Seguridad | `RateLimitFilter`, `JwtAuthenticationFilter`, `UsuarioDetailsService`, `JwtService`, `PasswordPolicy`, `GeneradorPassword` | Límite de peticiones por IP (429), validación del token, revalidación de la cuenta en cada petición, política y generación de contraseñas |
| Web | 5 controladores + `GlobalExceptionHandler` | Rutas REST por rol; traducción de cualquier error a JSON con el código HTTP correcto |
| Servicios | 8 servicios | Reglas de negocio: autenticación, matrículas, clases y progreso, catálogo público, administración, portal de padres (vínculos y cálculo del avance), auditoría y vencimiento automático |
| Persistencia | Repositorios JPA, Flyway, BD | Consultas parametrizadas (mitiga inyección SQL) y esquema versionado |

## 8.4 Componentes internos del front-end

```mermaid
flowchart TB
    MAIN["main.jsx"] --> EB["ErrorBoundary<br/>pantalla de error con recarga"]
    EB --> AP["AuthProvider<br/>AuthContext"]
    AP --> APP["App.jsx<br/>rutas + carga diferida"]

    APP --> HOME["Home<br/>página principal"]
    HOME --> CHAT["ChatFlotante<br/>asistente de preguntas frecuentes"]
    APP --> LOGIN["Login"]
    APP --> REG["Register"]
    APP --> NF["NotFound"]
    APP --> PR["ProtectedRoute<br/>valida sesión y rol"]

    PR --> AULA["Aula del alumno<br/>Inicio · Mis clases · Matrículas · Horarios · Cuenta"]
    PR --> FAM["Panel de Familia<br/>Mis hijos · Informe de avance · Cuenta"]
    PR --> ADMIN["Panel de administración<br/>Resumen · Usuarios · Matrículas · Clases · Solicitudes · Auditoría"]
    PR --> CPO["CambiarPasswordObligatorio"]

    AULA --> SHELL["PanelShell + ui<br/>Modal · Toast · Gráficos"]
    FAM --> SHELL
    ADMIN --> SHELL

    LOGIN --> CLIENT["api/client.js<br/>fetch + cabecera Bearer"]
    REG --> CLIENT
    AULA --> CLIENT
    FAM --> CLIENT
    ADMIN --> CLIENT
    CLIENT --> SES["api/session.js<br/>sessionStorage"]
    AP --> SES

    UTIL["utils<br/>format · horarios · passwordPolicy · descarga"]
    REG -.-> UTIL
    CHAT -.-> UTIL
    AULA -.-> UTIL
    ADMIN -.-> UTIL
```

Las pantallas `Login`, `Register`, `Aula`, `Familia`, `Admin`, `NotFound` y `CambiarPasswordObligatorio` se cargan **bajo demanda** (`React.lazy`): quien solo visita la página principal no descarga el código del Aula ni del Panel.

---

## 8.5 Diagrama de despliegue — producción

```mermaid
flowchart TB
    subgraph DEV["«device» Equipo del desarrollador"]
        GIT["Código fuente<br/>Git local"]
    end
    subgraph GH["«cloud» GitHub"]
        REPO["«artifact»<br/>Repositorio<br/>matematica-sin-estres2"]
        CI["«execution environment»<br/>GitHub Actions<br/>humo · suite · E2E · build"]
    end
    subgraph USR["«device» Dispositivo del usuario"]
        BR["«execution environment»<br/>Navegador web<br/>PC o celular"]
    end
    subgraph RND["«cloud» Render"]
        subgraph FE["«node» mse-frontend · Static Site"]
            DIST["«artifact»<br/>dist/<br/>HTML · JS · CSS"]
        end
        subgraph BE["«node» mse-backend · Web Service Docker"]
            JAR["«artifact»<br/>mse-api.jar<br/>Spring Boot · JRE 17"]
        end
        subgraph PG["«node» mse-db"]
            PGD[("PostgreSQL 16")]
        end
    end

    GIT -->|git push| REPO
    REPO -->|dispara| CI
    REPO -->|auto-deploy| DIST
    REPO -->|auto-deploy| JAR
    BR -->|"HTTPS 443"| DIST
    BR -->|"HTTPS 443 · REST JSON + JWT"| JAR
    JAR -->|"JDBC · TCP 5432 · red privada"| PGD
```

| Nodo | Tipo | Artefacto | Configuración (variables de entorno) |
|------|------|-----------|--------------------------------------|
| Dispositivo del usuario | `«device»` | Navegador moderno | — |
| `mse-frontend` | Render Static Site | `frontend/dist` (build de Vite) | `VITE_API_URL`, `VITE_WHATSAPP_NUMBER` (se incrustan al compilar) |
| `mse-backend` | Render Web Service (Docker) | `mse-api.jar` en imagen `eclipse-temurin:17-jre`, usuario sin privilegios | `SPRING_PROFILES_ACTIVE=prod`, `JWT_SECRET`, `JWT_EXPIRATION_MINUTES`, `DB_*`, `CORS_ALLOWED_ORIGINS` |
| `mse-db` | Render PostgreSQL 16 | Esquema creado por Flyway al primer arranque | Credenciales inyectadas a `mse-backend` |
| GitHub Actions | `«execution environment»` | Flujo `.github/workflows/ci.yml` | Sin secretos: las pruebas usan H2 |

| Conexión | Protocolo | Seguridad |
|----------|-----------|-----------|
| Navegador → front-end | HTTPS 443 | TLS de Render; cabeceras `X-Frame-Options`, `nosniff`, `Referrer-Policy` |
| Navegador → API | HTTPS 443, REST/JSON | JWT en `Authorization: Bearer`; CORS restringido al dominio del front-end |
| API → base de datos | JDBC sobre TCP 5432 | Red privada de Render; credenciales por variables de entorno |

> **Restricciones del plan gratuito de Render:** la API se suspende tras 15 minutos sin uso (el primer acceso tarda ≈ 50 s) y la base de datos vence a los 30 días. Ver riesgos R1 y R2 en el [plan de pruebas](06-plan-de-pruebas.md#710-riesgos-y-contingencias).

## 8.6 Diagrama de despliegue — desarrollo local

```mermaid
flowchart LR
    BR2["«execution environment»<br/>Navegador"]
    subgraph PC["«device» Equipo del desarrollador"]
        VITE["«node»<br/>Vite dev server :5173<br/>proxy de /api"]
        subgraph DC["docker compose"]
            API2["«node»<br/>backend :8080<br/>perfil prod"]
            PG2[("«node»<br/>PostgreSQL 16 :5432")]
        end
    end
    BR2 -->|HTTP| VITE
    VITE -->|"HTTP · /api"| API2
    API2 -->|JDBC| PG2
```

Variante sin Docker: `mvn spring-boot:run` levanta la API en `:8080` con **H2 en memoria** (perfil `dev`), que es también el entorno de las pruebas automatizadas.
