#!/usr/bin/env bash
# Crea en GitHub las etiquetas que usa el flujo de control de cambios (requiere GitHub CLI autenticado: gh auth login).
# Uso: scripts/crear-etiquetas.sh [propietario/repositorio]
set -euo pipefail
REPO="${1:-BryanDiaz23/matematica-sin-estres2}"

crear() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

crear "rfc"                   "5319E7" "Solicitud de cambio (RFC)"
crear "cambio-estandar"       "0E8A16" "Cambio estándar preaprobado: bajo riesgo"
crear "cambio-normal"         "FBCA04" "Cambio normal: requiere aprobación del CAB"
crear "cambio-emergencia"     "B60205" "Cambio de emergencia: autoriza el ECAB"
crear "estado:registrado"     "C5DEF5" "RFC registrado, pendiente de evaluación"
crear "estado:en-evaluacion"  "BFD4F2" "En evaluación por el CAB"
crear "estado:aprobado"       "0E8A16" "Aprobado por el CAB: se puede integrar"
crear "estado:rechazado"      "E99695" "Rechazado por el CAB"
crear "estado:implementado"   "1D76DB" "Desplegado en producción y validado"
crear "estado:revertido"      "D93F0B" "Se aplicó el plan de reversión"
crear "riesgo:bajo"           "C2E0C6" "Probabilidad × impacto 1–2"
crear "riesgo:medio"          "FEF2C0" "Probabilidad × impacto 3–4"
crear "riesgo:alto"           "F9D0C4" "Probabilidad × impacto 6–9"
crear "prioridad:P1"          "B60205" "Incidente crítico"
crear "incidente"             "D93F0B" "Interrupción o degradación del servicio"
crear "solicitud-servicio"    "0052CC" "Solicitud de servicio interna"
echo "Etiquetas listas en $REPO"
