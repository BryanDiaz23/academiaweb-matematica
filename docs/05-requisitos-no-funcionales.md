# 6. Requisitos No Funcionales (ISO/IEC 25010)

Los **requisitos no funcionales (RNF)** representan las características generales y restricciones del sistema: no dicen *qué hace* la plataforma, sino *qué tan bien* lo hace (seguridad, rapidez, disponibilidad, facilidad de uso, compatibilidad…). Para que sean verificables se organizan con el modelo de **calidad del producto de software ISO/IEC 25010 (SQuaRE)**, que define 9 características. Cada RNF tiene una **métrica medible**, la **evidencia** en el proyecto y el **caso de prueba** que lo verifica (ver [06-plan-de-pruebas.md](06-plan-de-pruebas.md)).

**Estados usados:** `Cumple` = hay implementación y prueba · `Implementado` = existe en el código pero su prueba aún no se ha ejecutado y adjuntado como evidencia · `Parcial` = cubierto a medias · `Pendiente` = identificado y sin resolver · `No aplica` = justificado.

---

## 6.1 Matriz de RNF por característica ISO/IEC 25010

### 1. Adecuación funcional

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-ADF-01 | Completitud funcional | El 100 % de las historias de usuario de prioridad *Must* del [backlog](08-scrum-y-prototipos.md) está implementado para los tres roles (visitante, alumno, administrador) | [README → Funcionalidades](../README.md) | Matriz funcional 4.1 · Postman 42 peticiones | Cumple |
| RNF-ADF-02 | Corrección funcional | Las fechas de vigencia de una matrícula se calculan igual en el servidor y en el navegador (suma de meses respetando fin de mes) | `MatriculaService`/`VencimientoMatriculasService` · `sumarMesesISO` | VEN-01…03 · FMT-08 | Cumple |
| RNF-ADF-03 | Pertinencia funcional | Un alumno solo ve clases de los niveles con matrícula **activa y vigente** | `ClaseService.detalleParaAlumno` | BAC-03 · VEN-01 · PRO-02 | Cumple |

### 2. Eficiencia de desempeño

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-EFI-01 | Comportamiento temporal | Percentil 95 del tiempo de respuesta < **500 ms** en los endpoints públicos | Consultas JPA simples · `open-in-view: false` | RND-01 · aserción de SLA en Postman | Implementado |
| RNF-EFI-02 | Utilización de recursos | Respuestas JSON ≥ 1 KB comprimidas; el visitante de la página principal no descarga el código del Aula ni del Panel | `server.compression` (application.yml) · `React.lazy` en `App.jsx` · pool Hikari de 5 conexiones en prod | Revisión del build (`npm run build` lista los *chunks*) · cabecera `Content-Encoding` | Implementado |
| RNF-EFI-03 | Capacidad | 300 peticiones concurrentes (20 hilos) en 200; con 10, 40 y 80 hilos **cero** errores 5xx | API *stateless* (escala por instancias) | RND-02 · RND-03 | Implementado |

### 3. Compatibilidad

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-COM-01 | Interoperabilidad | La API expone contratos REST/JSON documentados que cualquier cliente puede consumir (Postman, front-end) | Tabla de endpoints del README · colección Postman | Postman · HUM-01 | Cumple |
| RNF-COM-02 | Coexistencia | Los mismos migrations funcionan en PostgreSQL 16 (producción) y H2 (desarrollo y pruebas) | Flyway V1–V4 | POR-01 | Cumple |
| RNF-COM-03 | Compatibilidad con navegadores y dispositivos | Se usa correctamente en Chrome de escritorio y en móvil (pantalla 412 px) | Diseño responsive con Tailwind | E2E-01…04 y E2E-07 en proyectos `escritorio` y `movil` (Playwright) | Parcial · falta prueba manual en Firefox, Safari y Edge |

### 4. Capacidad de interacción (usabilidad)

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-INT-01 | Reconocibilidad y aprendizabilidad | Un visitante entiende qué ofrece la academia y cómo matricularse desde la página principal (sección "¿Cómo funciona?") | `Home.jsx` | Prueba de usabilidad T1 (08 § 6) | Parcial · falta ejecutar la prueba con usuarios |
| RNF-INT-02 | Protección contra errores de usuario | No se puede enviar un registro con contraseña que incumpla la política; el usuario ve en tiempo real qué regla falta | `PasswordChecklist`, `passwordPolicy.js` | USA-01 · E2E-05 · PWD-F01…F08 | Cumple |
| RNF-INT-03 | Operabilidad | Las acciones destructivas (anular matrícula, eliminar clase) piden confirmación | Modal de confirmación del panel | Revisión manual | Cumple |
| RNF-INT-04 | Inclusividad / accesibilidad | Campos con `<label>` asociado, diálogos con foco atrapado y tecla Esc, mensajes con `role="alert"`, idioma `es`, respeto a "reducir movimiento" | `Modal.jsx`, `Alerta.jsx`, `index.css` | E2E-02 (localiza campos por etiqueta accesible) | Parcial · falta auditoría automática (Lighthouse/axe) y verificar contraste |
| RNF-INT-05 | Auto-descriptividad | Los errores se muestran en español claro, sin códigos técnicos | `GlobalExceptionHandler` · `Alerta` | AUT-02 · SEC-05/06 | Cumple |

### 5. Fiabilidad

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-FIA-01 | Ausencia de fallos | Ninguna entrada inválida del cliente provoca un 500: JSON roto → 400, tipo de contenido erróneo → 415, verbo erróneo → 405 | `GlobalExceptionHandler` (se corrigió el caso 415, que antes caía en 500) | SEC-05 · SEC-06 · SEC-07 · HTTP-01 | Implementado |
| RNF-FIA-02 | Disponibilidad | Objetivo de la cátedra: ≥ 99,9 % del tiempo | Health check `/api/public/health` | DIS-01 | **Pendiente** · el plan gratuito de Render suspende el servicio tras 15 min sin uso (primer acceso ≈ 50 s): con ese plan el objetivo **no es alcanzable**; requiere plan de pago o un monitor de *keep-alive* |
| RNF-FIA-03 | Tolerancia a fallos | Un error al dibujar una pantalla muestra un mensaje y opción de recargar, no una página en blanco; el apagado del servidor termina las peticiones en curso | `ErrorBoundary.jsx` · `server.shutdown: graceful` | Revisión manual (forzar un error en desarrollo) | Implementado |
| RNF-FIA-04 | Capacidad de recuperación | Esquema reproducible desde cero y copias de seguridad de la BD | Flyway (esquema reproducible) | POR-01 | Parcial · **sin copias de seguridad** en la BD gratuita de Render (vence a los 30 días) |

### 6. Seguridad

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-SEG-01 | Confidencialidad | Los datos solo son accesibles con el rol adecuado; el enlace de las clases nunca sale en endpoints públicos | `SecurityConfig` · `@PreAuthorize` · `ClaseResumenDto` | BAC-01…03 · SEG-01 · HUM-02 | Cumple |
| RNF-SEG-02 | Integridad | Un token alterado, vencido o sin firma (`alg: none`) se rechaza; las entradas se validan en el servidor; contraseñas con BCrypt costo 12 | `JwtService` · Bean Validation · `@SinHtml` | JWT-02/03 · UNIT-09…13 · XSS-01/02 · SEC-03/04 | Cumple |
| RNF-SEG-03 | No repudio y responsabilidad | Login, bloqueos, registros y acciones del admin quedan en una bitácora consultable | `AuditoriaService` · pestaña *Auditoría* | Postman "Bitácora de auditoría" | Cumple |
| RNF-SEG-04 | Autenticidad | Política de contraseñas robustas, bloqueo tras 5 intentos (423), mismo mensaje para usuario inexistente y clave errónea | `PasswordPolicy` · `AuthService.login` | AUT-02…04 · CRED-01…04 · PWD-F | Cumple |
| RNF-SEG-05 | Resistencia | Más de 10 logins/min por IP → 429; las cargas de inyección SQL y XSS no alteran datos | `RateLimitFilter` | RL-01 · SQLI-01/02 · XSS-01/02 (refuerzo con lotes de cargas: SEC-01…03) | Cumple |
| RNF-SEG-06 | Configuración segura | Cabeceras `X-Frame-Options`, `nosniff`, CSP, `Referrer-Policy` y `Permissions-Policy` | `SecurityConfig` | SEG-02 (las cinco primeras cabeceras) · HUM-04 (`Permissions-Policy`, nueva) | Implementado |

### 7. Mantenibilidad

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-MAN-01 | Modularidad | Capas separadas (controlador → servicio → repositorio) y una pantalla por componente React | [Diagrama de componentes](07-arquitectura-componentes-despliegue.md) | Revisión de diseño | Cumple |
| RNF-MAN-02 | Reusabilidad | Componentes y utilidades compartidos (`ui.jsx`, `Modal`, `format.js`, `passwordPolicy.js`) | `frontend/src/components`, `utils` | Revisión de código | Cumple |
| RNF-MAN-03 | Analizabilidad | Errores con ruta y estado en JSON; bitácora de auditoría; logs sin datos sensibles | `ApiError` · `AuditoriaService` | Revisión de código | Cumple |
| RNF-MAN-04 | Capacidad para ser modificado | Cambios de esquema versionados (Flyway) y dependencias vigiladas | `db/migration` · `.github/dependabot.yml` | CI | Cumple |
| RNF-MAN-05 | Capacidad para ser probado | Cobertura de instrucciones del back-end ≥ **70 %**; suite ejecutada en cada *push* | JaCoCo + GitHub Actions (`ci.yml`) | Resumen de cobertura del CI | Implementado · medir tras el primer CI en verde |

### 8. Flexibilidad

| ID | Sub-característica | Requisito (métrica) | Evidencia en el proyecto | Verificación | Estado |
|----|--------------------|---------------------|--------------------------|--------------|--------|
| RNF-FLE-01 | Adaptabilidad | Toda configuración sensible o de entorno sale de variables de entorno y perfiles (`dev`/`prod`) | `application*.yml` · `.env.example` | Despliegue Render | Cumple |
| RNF-FLE-02 | Escalabilidad | La API no guarda sesión en el servidor (JWT), por lo que puede replicarse detrás de un balanceador | `SessionCreationPolicy.STATELESS` | Prueba de carga RND-02/03 | Parcial · el límite de peticiones (`RateLimitFilter`) es en memoria, por instancia |
| RNF-FLE-03 | Instalabilidad | Un entorno completo se levanta con un comando (`docker compose up`) y se despliega con `render.yaml` | [04-despliegue.md](04-despliegue.md) | Ejecución manual | Cumple |
| RNF-FLE-04 | Reemplazabilidad | El motor de BD se puede cambiar sin tocar el código (JPA + Flyway) | Perfiles H2/PostgreSQL | POR-01 | Cumple |

### 9. Protección (*safety*)

| ID | Sub-característica | Requisito | Justificación | Estado |
|----|--------------------|-----------|---------------|--------|
| RNF-PRO-01 | Restricción operativa, identificación de riesgos, protección ante fallos, advertencia de peligro, integración segura | Evitar estados que pongan en peligro la vida humana, la salud, la propiedad o el medio ambiente | La plataforma es una academia virtual: no controla equipos físicos ni procesos que puedan causar daño. Los riesgos de la información se tratan en *Seguridad*. | No aplica |

---

## 6.2 Resumen

| Estado | Cantidad |
|--------|---------:|
| Cumple | 20 |
| Implementado (falta ejecutar la prueba y adjuntar evidencia) | 7 |
| Parcial | 5 |
| Pendiente | 1 |
| No aplica | 1 |
| **Total de RNF** | **34** |

## 6.3 Brechas y acciones de cierre

| # | Brecha | Acción | RNF |
|---|--------|--------|-----|
| 1 | Disponibilidad ≥ 99,9 % no alcanzable con el plan gratuito | Pasar a plan de pago o agregar un monitor externo que consulte `/api/public/health` cada 10 min; documentar la decisión | RNF-FIA-02 |
| 2 | Sin copias de seguridad de la BD | Programar `pg_dump` periódico o usar un plan con *backups* | RNF-FIA-04 |
| 3 | Accesibilidad sin auditar | Ejecutar Lighthouse (pestaña *Accessibility*) sobre Inicio, Login, Registro y Aula; corregir hallazgos de contraste y adjuntar la captura | RNF-INT-04 |
| 4 | Navegadores no probados | Probar manualmente Firefox, Safari y Edge los casos E2E-01…08 y registrar el resultado | RNF-COM-03 |
| 5 | Límite de peticiones por instancia | Si se escala a más de una instancia, mover el contador a Redis o a la BD | RNF-FLE-02 |
| 6 | Pruebas nuevas sin evidencia | Ejecutar `mvn verify`, `npm test` y `npx playwright test`, y pegar los resúmenes en la columna *Resultado obtenido* de 03-pruebas.md | RNF-EFI, RNF-MAN-05 |
