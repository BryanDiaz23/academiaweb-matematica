# 9. Gestión Ágil (Scrum), Prototipo y Evaluación de Usabilidad

> **Cómo usar este documento.** El repositorio solo puede probar *qué se construyó*. Las fechas, los asistentes, los acuerdos de las reuniones y los resultados de las pruebas con usuarios **solo los puede escribir el equipo**. Por eso esos campos están en blanco como `_[completar]_`. No inventes datos: el docente puede pedir las evidencias originales (Monitor, OneDrive, GitLab).

## 9.1 Equipo y roles Scrum

| Rol | Responsabilidad | Persona |
|-----|-----------------|---------|
| Product Owner | Prioriza el *Product Backlog* y acepta o rechaza lo entregado | _[completar]_ |
| Scrum Master | Facilita las ceremonias y quita impedimentos | _[completar]_ |
| Equipo de desarrollo | Diseña, programa y prueba | _[completar]_ |
| Responsable de pruebas (QA) | Ejecuta el [plan de pruebas](06-plan-de-pruebas.md) y registra defectos | _[completar]_ |

Herramientas de seguimiento que pide el curso: **Monitor** (tablero y backlog), **OneDrive** (documentos) y **GitLab** (repositorio). Este proyecto está en GitHub; si el curso exige GitLab basta con añadir un segundo remoto:

```bash
git remote add gitlab https://gitlab.com/<usuario>/<repo>.git
git push gitlab main
```

## 9.2 Product Backlog

Prioridad: **A** = indispensable, **M** = importante, **B** = deseable. La columna *Estado* sale de lo que existe en el repositorio; los **puntos de historia** los define el equipo en el *Planning*.

| ID | Historia de usuario | Prioridad | Puntos | Estado | Evidencia |
|----|---------------------|-----------|--------|--------|-----------|
| HU-01 | Como visitante quiero ver los niveles y precios para elegir el curso | A | _[ ]_ | Hecha | `GET /api/public/niveles`, Home |
| HU-02 | Como visitante quiero ver los horarios para saber cuándo hay clase | A | _[ ]_ | Hecha | `GET /api/public/horarios` |
| HU-03 | Como visitante quiero solicitar una clase de diagnóstico | A | _[ ]_ | Hecha | `POST /api/public/solicitudes`, SOL-01 |
| HU-04 | Como visitante quiero registrarme con una contraseña segura | A | _[ ]_ | Hecha | `POST /api/auth/register`, CRED-01…04 |
| HU-05 | Como usuario quiero iniciar y cerrar sesión | A | _[ ]_ | Hecha | `POST /api/auth/login`, AUT-01…05 |
| HU-06 | Como alumno quiero solicitar una matrícula | A | _[ ]_ | Hecha | Aula › Matrículas, MAT-01 |
| HU-07 | Como alumno quiero ver las clases grabadas de mi nivel | A | _[ ]_ | Hecha | Aula › Mis clases, CLA-01 |
| HU-08 | Como alumno quiero marcar clases como vistas o favoritas | M | _[ ]_ | Hecha | `progreso_clases`, PRO-01…04 |
| HU-09 | Como alumno quiero ver los horarios y descargar un recordatorio | M | _[ ]_ | Hecha | Aula › Horarios, `.ics`, HOR-01…09 |
| HU-10 | Como administrador quiero activar, renovar o anular matrículas | A | _[ ]_ | Hecha | Panel › Matrículas, MAT-02 |
| HU-11 | Como administrador quiero gestionar las clases grabadas | A | _[ ]_ | Hecha | Panel › Clases, CLA-02 |
| HU-12 | Como administrador quiero restablecer contraseñas olvidadas | M | _[ ]_ | Hecha | PWD-01/02 |
| HU-13 | Como administrador quiero ver la bitácora de accesos | M | _[ ]_ | Hecha | Panel › Auditoría |
| HU-14 | Como administrador quiero un resumen con estadísticas | M | _[ ]_ | Hecha | Panel › Resumen, EST-01 |
| HU-15 | Como administrador quiero activar, desactivar y desbloquear usuarios | A | _[ ]_ | Hecha | Panel › Usuarios, AUT-04 |
| HU-16 | Como administrador quiero atender las solicitudes de diagnóstico | M | _[ ]_ | Hecha | Panel › Solicitudes |
| HU-17 | Como usuario quiero cambiar mi contraseña | M | _[ ]_ | Hecha | `PUT /api/auth/password` |
| HU-18 | Como usuario quiero recuperar mi contraseña por correo sin ayuda del administrador | B | _[ ]_ | Pendiente | Hoy se resuelve con HU-12 |
| HU-19 | Como alumno quiero pagar la matrícula en línea | B | _[ ]_ | Pendiente | Hoy se coordina por WhatsApp |
| HU-20 | Como padre, madre o apoderado quiero ver cómo avanza mi hijo (clases vistas, minutos, última actividad, alertas) y descargar o imprimir su informe | A | _[ ]_ | Hecha (v1.5) | Panel de Familia, APO-01…10, FAM-01…12, E2E-08 |
| HU-21 | Como administrador quiero vincular a cada apoderado con sus hijos | A | _[ ]_ | Hecha (v1.5) | Panel › Familias, APO-05, APO-08 |

### Definición de «Hecho» (DoD)

Una historia está terminada cuando cumple **todo** lo siguiente:

- [ ] Cumple sus criterios de aceptación y el Product Owner la aceptó.
- [ ] Tiene pruebas automatizadas que pasan (`mvn verify`, `npm test`).
- [ ] No baja la cobertura por debajo de 70 % (informe JaCoCo).
- [ ] Pasó la revisión de código (*pull request* con al menos una aprobación).
- [ ] No introduce defectos críticos ni altos abiertos.
- [ ] Respeta las reglas de seguridad ([02-seguridad.md](02-seguridad.md)).
- [ ] Documentación actualizada y desplegada en el entorno de pruebas.

## 9.3 Sprints

> **Propuesta a ajustar.** Esta tabla relaciona los *sprints* con la evidencia que dejó cada versión del repositorio. Cambia los nombres, objetivos y fechas por los que realmente definió el equipo.

| Sprint | Objetivo | Historias | Evidencia en el repositorio | Fechas |
|--------|----------|-----------|-----------------------------|--------|
| 1 | Catálogo público y registro | HU-01…05 | v1.0: API pública, autenticación JWT, BD con Flyway | _[completar]_ |
| 2 | Aula del alumno | HU-06…09, HU-17 | v1.1 y v1.2: matrículas, clases por nivel, progreso | _[completar]_ |
| 3 | Panel de administración | HU-10…16 | v1.2: panel con 6 secciones y auditoría | _[completar]_ |
| 4 | Seguridad y despliegue | Transversal | Cabeceras, límite de peticiones, bloqueo de cuenta, Render | _[completar]_ |
| 5 | Calidad y pruebas | Transversal | v1.3: [plan de pruebas](06-plan-de-pruebas.md), RNF ISO 25010, pruebas por niveles, CI | _[completar]_ |

### Tablero (Kanban) al cierre del sprint 5

| Por hacer | En progreso | En pruebas | Hecho |
|-----------|-------------|------------|-------|
| HU-18, HU-19 | Ejecutar y completar resultados (06 §7.15) | Pruebas E2E, rendimiento y seguridad (ejecución pendiente) | HU-01…HU-17 |

## 9.4 Ceremonias

### Planificación del sprint (*Sprint Planning*)

| Campo | Contenido |
|-------|-----------|
| Sprint | _[completar]_ |
| Fecha y duración | _[completar]_ |
| Objetivo del sprint | _[completar]_ |
| Historias comprometidas | _[completar]_ |
| Capacidad del equipo | _[completar]_ |

### Reunión diaria (*Daily*, máximo 15 minutos)

Cada integrante responde tres preguntas: **¿qué hice ayer?, ¿qué haré hoy?, ¿qué me bloquea?**

| Fecha | Integrante | Ayer | Hoy | Impedimentos |
|-------|------------|------|-----|--------------|
| _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

### Revisión del sprint (*Sprint Review*)

Se muestra el **incremento funcionando** al Product Owner y a los interesados, y se recoge su retroalimentación.

| Historia | ¿Aceptada? | Observaciones del Product Owner |
|----------|------------|---------------------------------|
| _[ ]_ | _[ ]_ | _[ ]_ |

### Retrospectiva del sprint

Se hace con una de estas dos dinámicas. Cada columna se llena con notas adhesivas del equipo.

**Estrella de mar (*Starfish*)**

| Empezar a hacer | Hacer más | Seguir haciendo | Hacer menos | Dejar de hacer |
|-----------------|-----------|-----------------|-------------|----------------|
| _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

**Velero (*SailBoat*)**

| Viento (lo que nos impulsa) | Ancla (lo que nos frena) | Rocas (riesgos) | Isla (la meta) |
|-----------------------------|--------------------------|-----------------|----------------|
| _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

**Acuerdos de mejora**

| # | Acuerdo | Responsable | Para cuándo | Estado |
|---|---------|-------------|-------------|--------|
| 1 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

## 9.5 Acta de reunión

Plantilla para cada reunión (se guarda en OneDrive y se resume en la tabla de registro).

| Campo | Contenido |
|-------|-----------|
| Proyecto | Matemática Sin Estrés |
| Tipo de reunión | _[Planning / Daily / Review / Retrospectiva / Otra]_ |
| Fecha, hora y lugar | _[completar]_ |
| Asistentes | _[completar]_ |
| Agenda | _[completar]_ |
| Acuerdos | _[completar]_ |
| Tareas asignadas (responsable y fecha) | _[completar]_ |
| Próxima reunión | _[completar]_ |

**Registro de actas**

| N.º | Fecha | Tipo | Enlace al acta | Acuerdos clave |
|-----|-------|------|----------------|----------------|
| 1 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

## 9.6 Prototipo y evaluación de usabilidad

### Qué se evalúa

El prototipo evaluado es la **aplicación real desplegada** (no una maqueta), porque ya incluye todas las pantallas. Las pantallas son: Home, Login, Registro, Aula del alumno (5 secciones) y Panel de administración (6 secciones).

Para el curso se recomienda además adjuntar los bocetos o *wireframes* iniciales (Figma, Canva o papel) si existen: _[adjuntar]_.

### Perfil de los participantes

Recomendado: **5 personas** por ronda; con 5 se detecta la mayoría de los problemas de usabilidad.

| Participante | Perfil (edad, rol) | Experiencia con plataformas en línea | Dispositivo |
|--------------|--------------------|--------------------------------------|-------------|
| P1 | _[ ]_ | _[ ]_ | _[ ]_ |
| P2 | _[ ]_ | _[ ]_ | _[ ]_ |
| P3 | _[ ]_ | _[ ]_ | _[ ]_ |
| P4 | _[ ]_ | _[ ]_ | _[ ]_ |
| P5 | _[ ]_ | _[ ]_ | _[ ]_ |

### Tareas

Se le pide a cada participante resolver cada tarea **sin ayuda**, mientras piensa en voz alta. Se anota si la completó, cuánto tardó y dónde se confundió.

| Tarea | Instrucción | Éxito si… |
|-------|-------------|-----------|
| T1 | Encuentra cuánto cuesta el nivel de Secundaria | Llega al precio desde la página principal |
| T2 | Pide una clase de diagnóstico | Envía el formulario y ve la confirmación |
| T3 | Crea una cuenta | Registra una contraseña que cumple la política |
| T4 | Inicia sesión y encuentra una clase grabada | Abre una clase de su nivel |
| T5 | Marca una clase como favorita | La clase aparece como favorita |
| T6 | Cambia tu contraseña | Recibe el mensaje de éxito |

### Resultados por tarea (completar)

| Tarea | Éxitos (de 5) | Tiempo medio | Errores observados | Gravedad (0–4) |
|-------|---------------|--------------|--------------------|----------------|
| T1 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |
| T2 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |
| T3 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |
| T4 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |
| T5 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |
| T6 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

Gravedad: 0 = no es problema · 1 = cosmético · 2 = menor · 3 = mayor · 4 = catastrófico.

### Cuestionario SUS (*System Usability Scale*)

Cada participante responde de **1 (totalmente en desacuerdo) a 5 (totalmente de acuerdo)**.

| N.º | Afirmación |
|-----|------------|
| 1 | Creo que me gustaría usar este sitio con frecuencia. |
| 2 | Encontré el sitio innecesariamente complejo. |
| 3 | Pensé que el sitio era fácil de usar. |
| 4 | Creo que necesitaría ayuda de una persona técnica para usarlo. |
| 5 | Encontré que las funciones estaban bien integradas. |
| 6 | Pensé que había demasiada inconsistencia en el sitio. |
| 7 | Imagino que la mayoría de la gente aprendería a usarlo rápidamente. |
| 8 | Encontré el sitio muy incómodo de usar. |
| 9 | Me sentí muy seguro al usar el sitio. |
| 10 | Necesité aprender muchas cosas antes de poder usarlo. |

**Cálculo del puntaje:** en las preguntas impares (1, 3, 5, 7, 9) se resta 1 a la respuesta; en las pares (2, 4, 6, 8, 10) se calcula 5 menos la respuesta. Se suman los diez valores y se multiplica por 2,5: el resultado va de 0 a 100. Se promedia entre participantes. **Meta del proyecto: SUS ≥ 68** (promedio de la industria).

| Participante | P1 | P2 | P3 | P4 | P5 | Promedio |
|--------------|----|----|----|----|----|----------|
| Puntaje SUS | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

### Hallazgos y mejoras

| # | Hallazgo | Tarea / participante | Gravedad | Mejora propuesta | Historia o defecto | Estado |
|---|----------|----------------------|----------|------------------|--------------------|--------|
| 1 | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ | _[ ]_ |

Tras corregir los hallazgos de gravedad 3 y 4 se repite la prueba con otros participantes (**ronda 2**) y se compara el SUS.

## 9.7 Informe de avance

| Aspecto | Estado |
|---------|--------|
| Historias del *backlog* completadas | 19 de 21 (HU-18 y HU-19 son deseables y están pendientes; HU-20 y HU-21 se añadieron en la versión 1.5) |
| Documentación técnica | Completa: BD, seguridad, pruebas, despliegue, RNF ISO 25010, plan de pruebas y arquitectura |
| Pruebas automatizadas | Diseñadas e integradas en CI. Hasta ahora solo se ejecutaron las 40 del front-end; el resto se ejecuta en GitHub Actions o en el equipo del desarrollador ([06 §7.15](06-plan-de-pruebas.md)) |
| Defectos | 1 hallado y corregido (DEF-001, 415 devuelto como 500) |
| Riesgos abiertos | R1 y R2 (plan gratuito de Render) |
| Pendiente del equipo | Fechas y actas reales, puntos de historia, pruebas de usabilidad con usuarios, capturas de evidencia |
