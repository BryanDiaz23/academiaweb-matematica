## RFC asociado

Cierra #<!-- número del issue RFC -->

**Tipo de cambio:**
- [ ] Estándar (preaprobado)
- [ ] Normal (aprobado por el CAB: etiqueta `estado:aprobado` en el RFC)
- [ ] Emergencia (autorizado por el ECAB, rama `hotfix/*`)

## Descripción del cambio

<!-- Qué cambia y por qué. -->

## Componentes afectados

- [ ] Front-end
- [ ] Back-end / API
- [ ] Base de datos (migración Flyway `V*__*.sql`)
- [ ] Infraestructura / CI-CD
- [ ] Documentación / cronograma

## Evidencia de pruebas

- [ ] `mvn verify` en verde (pruebas de humo, suite completa y cobertura)
- [ ] `npm test` y `npm run build` en verde
- [ ] Casos nuevos o actualizados: <!-- IDs, p. ej. MDA-01…10 -->

## Plan de reversión

<!-- Cómo se revierte si falla en producción (etiqueta estable, rollback de Render, script de BD). -->

## Lista de control

- [ ] CHANGELOG.md actualizado en la sección de la versión
- [ ] La migración de BD es compatible con la versión anterior (no elimina columnas ni tablas)
- [ ] Sin secretos ni credenciales en el código
