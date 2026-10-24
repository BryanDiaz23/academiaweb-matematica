#!/usr/bin/env bash
# Prueba rápida de sanidad (health check) después de un despliegue o de un rollback.
# Uso: scripts/health-check.sh <URL de la API> [versión esperada]
#   scripts/health-check.sh https://mse-backend.onrender.com 2.0.0
#   scripts/health-check.sh http://localhost:8080
# Sale con código 0 si todo está bien y 1 si alguna verificación falla.
set -uo pipefail

API="${1:?Indica la URL de la API, p. ej. https://mse-backend.onrender.com}"
API="${API%/}"
VERSION_ESPERADA="${2:-}"
LIMITE_MS="${LIMITE_MS:-2000}"     # RNF-04: respuesta < 2 s
INTENTOS="${INTENTOS:-6}"          # el plan gratuito de Render puede tardar ~1 min en despertar
fallos=0

ok()    { echo "  [OK]    $*"; }
falla() { echo "  [FALLA] $*"; fallos=$((fallos + 1)); }

echo "Verificando $API"

# 1) Health check con reintentos (arranque en frío)
estado=""
for i in $(seq 1 "$INTENTOS"); do
  cuerpo=$(curl -fsS --max-time 60 "$API/api/public/health" 2>/dev/null) && estado=$(echo "$cuerpo" | grep -o '"estado":"[A-Z]*"' | cut -d'"' -f4)
  [ "$estado" = "UP" ] && break
  echo "  ... intento $i/$INTENTOS sin respuesta UP, reintentando en 10 s"
  sleep 10
done
[ "$estado" = "UP" ] && ok "health check responde UP" || falla "health check no responde UP"

# 2) Versión desplegada
version=$(curl -fsS --max-time 30 "$API/api/public/version" 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
if [ -z "$version" ]; then
  falla "no se pudo leer /api/public/version"
elif [ -n "$VERSION_ESPERADA" ] && [ "$version" != "$VERSION_ESPERADA" ]; then
  falla "versión desplegada $version, se esperaba $VERSION_ESPERADA"
else
  ok "versión desplegada: $version"
fi

# 3) Funcionalidad principal: catálogo desde la base de datos y tiempo de respuesta
for ruta in /api/public/niveles /api/public/horarios /api/public/catalogo-servicios; do
  resultado=$(curl -sS -o /dev/null --max-time 30 -w '%{http_code} %{time_total}' "$API$ruta" 2>/dev/null || echo "000 0")
  codigo=${resultado%% *}
  ms=$(awk -v t="${resultado##* }" 'BEGIN { printf "%d", t * 1000 }')
  if [ "$codigo" != "200" ]; then
    falla "$ruta respondió $codigo"
  elif [ "$ms" -gt "$LIMITE_MS" ]; then
    falla "$ruta tardó $ms ms (límite $LIMITE_MS ms)"
  else
    ok "$ruta 200 en $ms ms"
  fi
done

# 4) La seguridad sigue activa: una ruta protegida sin token debe dar 401
codigo=$(curl -sS -o /dev/null --max-time 30 -w '%{http_code}' "$API/api/admin/usuarios" 2>/dev/null || echo 000)
[ "$codigo" = "401" ] && ok "ruta protegida sin token responde 401" || falla "ruta protegida sin token respondió $codigo (se esperaba 401)"

if [ "$fallos" -gt 0 ]; then
  echo "Resultado: $fallos verificación(es) fallida(s). Evaluar el plan de reversión (docs/10-gestion-del-cambio.md §6)."
  exit 1
fi
echo "Resultado: servicio operativo."
