#!/usr/bin/env bash
# scripts/rotate-relay-keys.sh
# Idempotent key rotation workflow (local KMS stub). Replace with cloud KMS calls in production.

set -euo pipefail

KEY_ID="${1:-relay-primary}"
BACKEND_DIR="$(dirname "$0")/.."

echo "Rotating keys for keyId=${KEY_ID}..."

# Example: generate a new ed25519 keypair using openssl (placeholder)
TMP_PRIV="$(mktemp)"
TMP_PUB="$(mktemp)"

openssl genpkey -algorithm ED25519 -out "$TMP_PRIV"
openssl pkey -in "$TMP_PRIV" -pubout -out "$TMP_PUB"

# In production: call KMS rotateKey method or upload new key to HSM
# Here we simply write to ops/keys/ as a demonstration (NOT for prod)
mkdir -p ops/keys
ts=$(date -u +"%Y%m%dT%H%M%SZ")
cp "$TMP_PRIV" "ops/keys/${KEY_ID}.priv.${ts}"
cp "$TMP_PUB" "ops/keys/${KEY_ID}.pub.${ts}"

echo "{\"keyId\":\"${KEY_ID}\",\"newVersion\":\"${ts}\"}"
rm -f "$TMP_PRIV" "$TMP_PUB"
