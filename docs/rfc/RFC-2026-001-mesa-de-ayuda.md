# RFC-2026-001 · Mesa de ayuda para solicitudes de servicio

| Campo | Detalle |
|-------|---------|
| Tipo de cambio | Normal |
| Solicitante | Bryan Díaz (Líder técnico), a pedido de la dirección académica |
| Componentes | Back-end (API), front-end (Aula, Familia, Admin), base de datos (migración V6) |
| Riesgo | Medio: probabilidad 2 × impacto 2 = 4 |
| Ventana | Domingo 25 de octubre de 2026, 23:00 – 01:00 |
| Aprobación | CAB: Líder técnico y representante de la academia |

## Descripción
Agregar a la plataforma una mesa de ayuda donde alumnos y apoderados registren solicitudes de servicio con un catálogo de
seis tipos, prioridad y SLA, y donde el administrador las atienda y mida el cumplimiento.

## Justificación
Las solicitudes llegaban solo por WhatsApp, sin registro, prioridad ni tiempos medibles. La guía del APF3 exige definir
el catálogo de solicitudes, su procedimiento y una herramienta de gestión.

## Análisis de impacto
- Usuarios: aparece la opción *Mesa de ayuda* para alumnos y apoderados y una pestaña nueva para el administrador. Nada existente cambia de comportamiento.
- Base de datos: la migración V6 solo **crea** la tabla `solicitudes_servicio`; no modifica tablas existentes.
- Disponibilidad: el redespliegue de Render reinicia la API (≈ 1 min) dentro de la ventana.

## Plan de pruebas
MDA-01…10 y VER-01 (integración), SLA-01…05 (unitarias), MDA-F01…F07 (front-end), CI completo en verde,
prueba manual en entorno local con PostgreSQL (`docker compose up --build`).

## Plan de reversión
Condición: la migración V6 falla o la API responde 5xx tras el despliegue. Acción: *Rollback* en Render al despliegue
de la v1.5.0 o `scripts/rollback.sh v1.5.0`. La tabla nueva puede quedar en la BD: la v1.5.0 no la usa. RTO 15 min.

## Revisión posimplementación
_Completar después del despliegue: resultado del health check, incidentes, uso del backout y lecciones aprendidas._
