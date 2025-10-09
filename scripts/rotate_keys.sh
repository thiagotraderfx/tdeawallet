#!/usr/bin/env bash
# scripts/rotate_keys.sh
# Rotación segura de claves locales (scaffold).
# - NO toca llaves de producción en KMS reales por defecto.
# - Diseñado para entornos de prueba y para integrarse con adaptadores KMS.
#
# Uso:
#  ./scripts/rotate_keys.sh --key-id key-abc-123 --dry-run
#
# Requerimientos:
#  - NODE env con script "rotate-key" (opcional) o integración directa con SDK KMS.
#  - Variables de entorno:
#      KMS_ENDPOINT (opcional, para adaptadores que requieren URL)
#      KMS_API_KEY   (opcional, para adaptadores que requieren credenciales)
#
# Seguridad:
#  - No imprime secretos en logs.
#  - Produce un JSON mínimo de auditoría en stdout (id, oldVersion, newVersion, ts).
#  - El modo --dry-run no realiza cambios.
#
set -euo pipefail

PROGNAME=$(basename "$0")
DRY_RUN=false
KEY_ID=""
ADAPTER="node"

usage() {
  cat <<EOF
Usage: $PROGNAME --key-id <id> [--dry-run] [--adapter <node|aws|gcp>]

Options:
  --key-id      ID de la clave a rotar (requerido)
  --adapter     adapter a usar: node (default), aws, gcp
  --dry-run     Simula el procedimiento sin cambios
  -h|--help     Muestra esta ayuda
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --key-id) KEY_ID="$2"; shift 2 ;;
    --adapter) ADAPTER="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1"; usage; exit 2 ;;
  esac
done

if [[ -z "$KEY_ID" ]]; then
  echo "ERROR: --key-id is required" >&2
  usage
  exit 2
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Auditoría: metadata minimal (sin secretos)
audit_record() {
  jq -n --arg keyId "$KEY_ID" --arg adapter "$ADAPTER" --arg ts "$TIMESTAMP" \
    '{ "keyId": $keyId, "adapter": $adapter, "timestamp": $ts, "dryRun": '$DRY_RUN' }'
}

echo "Starting key rotation for key: $KEY_ID" >&2
echo "Adapter: $ADAPTER, Dry run: $DRY_RUN" >&2

# Ejemplo: si ADAPTER=node, invocar un script node local que haga la rotación con el adaptador real.
if [[ "$ADAPTER" == "node" ]]; then
  if $DRY_RUN; then
    # Llamada al adaptador en modo dry-run — no debe cambiar estado
    echo "DRY RUN: Simulating rotateKey for $KEY_ID" >&2
    audit_record
    exit 0
  else
    # Ejecuta script node que llama a la librería KMS-adapter.
    if [[ ! -f ./bin/rotate-key.js ]]; then
      echo "ERROR: Missing ./bin/rotate-key.js. Please implement the adapter invocation." >&2
      audit_record
      exit 1
    fi

    # Ejecutar la rotación real (bin/rotate-key.js debería devolver JSON con { keyId, oldVersion, newVersion })
    set +e
    result=$(node ./bin/rotate-key.js --key-id "$KEY_ID" 2>/dev/null)
    rc=$?
    set -e
    if [[ $rc -ne 0 ]]; then
      echo "ERROR: rotation failed (adapter returned non-zero exit code)" >&2
      audit_record
      exit 3
    fi

    # Protege salida: parsea y muestra solo metadata no sensible
    echo "$result" | jq '{ keyId: .keyId, oldVersion: .oldVersion, newVersion: .newVersion, ts: "'$TIMESTAMP'"}'
    exit 0
  fi
fi

# For cloud adapters (AWS/GCP) we provide a safe fail with instructions
if [[ "$ADAPTER" == "aws" || "$ADAPTER" == "gcp" ]]; then
  echo "Cloud KMS adapters require secure credentials and are not executed from this script by default." >&2
  echo "Implement the cloud rotation logic in bin/rotate-key.js and call this script with --adapter node." >&2
  audit_record
  exit 2
fi

echo "Unsupported adapter: $ADAPTER" >&2
usage
exit 2
