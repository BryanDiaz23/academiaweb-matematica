#!/usr/bin/env bash
# Respaldo y restauración de la base de datos PostgreSQL (antes de todo cambio normal con migración).
# Requiere el cliente de PostgreSQL (pg_dump / pg_restore) y la URL de conexión externa de Render en DATABASE_URL.
#
#   DATABASE_URL=postgres://usuario:clave@host:5432/mse scripts/respaldo-bd.sh respaldar
#   DATABASE_URL=... scripts/respaldo-bd.sh restaurar respaldos/mse-20261025-2300.dump
set -euo pipefail

ACCION="${1:?Uso: respaldar | restaurar <archivo.dump>}"
: "${DATABASE_URL:?Define DATABASE_URL con la cadena de conexión de la base de datos}"
mkdir -p respaldos

case "$ACCION" in
  respaldar)
    ARCHIVO="respaldos/mse-$(date +%Y%m%d-%H%M).dump"
    pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$ARCHIVO"
    echo "Respaldo creado: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))"
    ;;
  restaurar)
    ARCHIVO="${2:?Indica el archivo .dump a restaurar}"
    echo "Se restaurará $ARCHIVO sobre la base de datos indicada. Escribe RESTAURAR para continuar:"
    read -r confirmacion
    [ "$confirmacion" = "RESTAURAR" ] || { echo "Cancelado."; exit 1; }
    pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$ARCHIVO"
    echo "Restauración terminada. Ejecuta scripts/health-check.sh para validar el servicio."
    ;;
  *)
    echo "Acción desconocida: $ACCION"; exit 1 ;;
esac
