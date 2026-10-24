# 11. Gestión de capacidad y rendimiento del servicio (APF3)

Práctica de **gestión de capacidad y rendimiento** de ITIL 4 y requisito 8.4.3 de ISO/IEC 20000-1 (*gestión de la capacidad*).
Objetivo: comprobar con mediciones que la plataforma cumple el SLA (p95 < 2 s, disponibilidad ≥ 99 %) y proyectar los recursos
necesarios a medida que crecen los alumnos.

## 11.1 Metodología

- **Herramienta:** `capacidad/carga.py` (Python, sin dependencias) y su equivalente `capacidad/k6-carga.js`.
- **Escenario:** usuarios concurrentes que recorren sin pausa las 7 rutas más usadas: 5 públicas (health, niveles, horarios,
  clases recientes, estadísticas) y 2 del aula con token JWT (`/api/alumno/matriculas`, `/api/alumno/clases`).
- **Escalones:** 1, 5, 10, 25 y 50 usuarios concurrentes, 15 s cada uno.
- **Entorno de la medición (23-10-2026):** API v2.0.0 en un contenedor Linux, **limitada a 1 vCPU** (`taskset`) y 384 MB de heap
  (`-Xmx384m`, como en una instancia de 512 MB), perfil dev con H2 en memoria, límite de peticiones desactivado para medir solo la capacidad.
  El generador de carga corrió en otros núcleos para no competir con la API.
- Resultados completos: `capacidad/resultados-2026-10-23.json`.

> Los usuarios simulados no tienen tiempo de espera entre peticiones: 1 usuario simulado genera tanta carga como decenas de alumnos reales.

## 11.2 Resultados

| Usuarios concurrentes | Peticiones | Peticiones/s | p50 (ms) | p95 (ms) | p99 (ms) | Máx. (ms) | Errores | Cumple SLA |
|----------------------:|-----------:|-------------:|---------:|---------:|---------:|----------:|--------:|:----------:|
| 1  | 3 814  | 254 | 2.5  | 10.9  | 17.5  | 162 | 0 % | Sí |
| 5  | 10 616 | 707 | 5.2  | 19.6  | 27.0  | 50  | 0 % | Sí |
| 10 | 10 288 | 685 | 10.0 | 39.4  | 51.4  | 105 | 0 % | Sí |
| 25 | 12 692 | 844 | 16.9 | 85.5  | 150.1 | 288 | 0 % | Sí |
| 50 | 13 681 | 909 | 28.8 | 182.1 | 430.3 | 912 | 0 % | Sí |

- **Memoria:** el proceso pasó de 320 MB en reposo a **412 MB de memoria residente** en el pico de 50 usuarios.
- **Arranque:** 12.5 s hasta *Started* (Flyway aplica V1–V6).
- **Punto de saturación:** con 1 vCPU el rendimiento se estabiliza en ≈ 900 peticiones/s; desde ahí más usuarios solo aumentan
  la latencia (la CPU es el cuello de botella, no la memoria ni la base de datos).
- **Rutas más costosas:** las del aula (`/api/alumno/clases`: p95 324 ms con 50 usuarios), porque validan el JWT, consultan las
  matrículas activas y el progreso. Las públicas se mantienen por debajo de 120 ms.

## 11.3 Demanda esperada y proyección

Supuestos: en el inicio de un turno se conecta el 20 % de los alumnos activos y cada uno genera ≈ 1 petición cada 5 s (0.2 peticiones/s).

| Escenario | Alumnos activos | Usuarios concurrentes en el pico | Carga pico | Uso de la capacidad medida (1 vCPU) |
|-----------|----------------:|---------------------------------:|-----------:|-------------------------------------:|
| Actual (piloto) | 100 | 20 | 4 pet/s | < 1 % |
| Meta 2027 | 300 | 60 | 12 pet/s | ≈ 1.3 % |
| Crecimiento | 1 000 | 200 | 40 pet/s | ≈ 4.4 % |

Con un plan de 0.1 vCPU (gratuito de Render) la capacidad estimada es ≈ 90 pet/s (escala lineal, estimación), suficiente
para la carga, pero ese plan **suspende el servicio tras 15 minutos sin tráfico** y la primera petición tarda hasta ~1 minuto
en responder. Eso incumple el p95 < 2 s y la disponibilidad ≥ 99 % en horario de clases, así que el límite real del plan
gratuito es la disponibilidad, no la CPU.

**Almacenamiento:** la tabla de mayor crecimiento es `auditoria_accesos` (≈ 2 inicios de sesión por alumno al día).
Con 300 alumnos: ≈ 18 000 filas al mes (≈ 4 MB). Las clases son enlaces (no videos), por lo que 1 GB de base de datos alcanza
para varios años.

## 11.4 Plan de capacidad

| Recurso | Hoy | Umbral de alerta | Acción planificada |
|---------|-----|------------------|--------------------|
| Back-end (Render) | Free: 0.1 vCPU, 512 MB, se suspende | Paso a producción real con alumnos, o p95 > 1 s sostenido | **Starter** (0.5 vCPU, 512 MB, sin suspensión) |
| Back-end, crecimiento | — | CPU > 70 % o memoria > 80 % durante el turno pico | **Standard** (1 vCPU, 2 GB) y `-XX:MaxRAMPercentage=75` |
| Base de datos (Render PostgreSQL) | Free: 1 GB, vence a los 30 días, sin respaldos | Antes del vencimiento del plan gratuito o uso > 70 % | Plan pagado básico con respaldos diarios (RPO 24 h) |
| Front-end (Static Site + CDN) | Gratuito | — | Sin cambios: archivos estáticos servidos por CDN |
| Pool de conexiones (HikariCP) | 10 por defecto | Esperas de conexión en los logs | Subir a 15–20 según el límite del plan de BD |
| Límite por IP | 10 login/min, 5 registros/min, 5 solicitudes/min | Bloqueos de usuarios legítimos (429) | Ajustar en `application.yml` (cambio estándar) |

> Precios y características de referencia de Render a la fecha del informe; confirmarlos al contratar.

**Seguimiento (ciclo mensual):**
1. `verificacion-produccion.yml` mide disponibilidad y tiempo de respuesta cada 30 minutos en horario de servicio.
2. Al cierre de cada mes se ejecuta `python3 capacidad/carga.py --url https://mse-backend.onrender.com --escalones 1,5,10 --duracion 20`
   (fuera del horario de clases) y se comparan los resultados con esta línea base.
3. Los cambios de plan se tramitan como **RFC normal** (componente *Infraestructura*).
