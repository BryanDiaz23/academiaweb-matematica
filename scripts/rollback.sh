#!/usr/bin/env bash
# Plan de reversión (backout) de la aplicación a una versión estable etiquetada.
# Crea la rama hotfix/rollback-<etiqueta> con el contenido exacto de esa etiqueta, lista para un PR de emergencia.
# Al integrarse en main, Render vuelve a desplegar automáticamente la versión estable.
#
# Uso: scripts/rollback.sh v1.5.0 [--local]
#   --local  además reconstruye y levanta el entorno Docker local con esa versión (docker compose).
#
# Base de datos: las migraciones Flyway del proyecto solo agregan (expand). La versión anterior funciona con el
# esquema nuevo, por eso el rollback de la aplicación no toca la BD. Si un cambio sí modificó datos, restaurar
# el respaldo previo con scripts/respaldo-bd.sh restaurar <archivo>.
set -euo pipefail

ETIQUETA="${1:?Indica la etiqueta estable, p. ej. v1.5.0 (git tag --list 'v*')}"
MODO="${2:-}"

git fetch --tags origin >/dev/null 2>&1 || true
git rev-parse -q --verify "refs/tags/$ETIQUETA" >/dev/null || { echo "No existe la etiqueta $ETIQUETA"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Hay cambios sin confirmar; guárdalos antes del rollback."; exit 1; }

RAMA="hotfix/rollback-$ETIQUETA"
echo "1) Creando $RAMA desde main con el contenido de $ETIQUETA"
git checkout -B "$RAMA" origin/main 2>/dev/null || git checkout -B "$RAMA" main
# Deja el índice y el árbol de trabajo idénticos a la etiqueta (borra lo que se agregó después)
git read-tree -u --reset "$ETIQUETA"
git commit -q -m "Rollback de emergencia a $ETIQUETA" -m "RFC de emergencia: plan de reversión, docs/10-gestion-del-cambio.md §6."
echo "   Commit creado. Sube la rama y abre el PR de emergencia:"
echo "   git push -u origin $RAMA"

if [ "$MODO" = "--local" ]; then
  echo "2) Entorno local: deteniendo contenedores y levantando $ETIQUETA"
  docker compose down
  docker compose up --build -d
  sleep 20
  bash scripts/health-check.sh http://localhost:8080 "${ETIQUETA#v}"
fi
