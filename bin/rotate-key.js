#!/usr/bin/env node
/**
 * bin/rotate-key.js
 *
 * Invoca al adaptador KMS (src/lib/kms-adapter) para rotar una clave.
 * Output: JSON con { keyId, oldVersion, newVersion, ts }
 *
 * Seguridad:
 *  - NO imprime secretos ni claves privadas.
 *  - Solo muestra metadata mínima en stdout.
 *
 * Uso:
 *  node ./bin/rotate-key.js --key-id key-abc-123
 *
 * Para pruebas:
 *  NODE_ENV=test node ./bin/rotate-key.js --key-id unit-test-key
 *
 * Requisitos:
 *  - El adaptador debe lanzar errores controlados (throw Error('...')) si falla.
 */

'use strict';

const path = require('path');
// Se asume que este script se ejecuta desde la raíz del proyecto.
// Para que `require` resuelva el alias '@', necesitamos registrarlo.
require('module-alias/register');

function usage() {
  console.error('Usage: node bin/rotate-key.js --key-id <id>');
  process.exit(2);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--key-id' && i + 1 < argv.length) {
      args.keyId = argv[++i];
      continue;
    }
    if ((a === '-h') || (a === '--help')) {
      usage();
    }
    // ignore unknown flags for forward compatibility
  }
  return args;
}

/**
 * Safe JSON output helper — only prints non-sensitive fields.
 */
function printResultJSON(obj) {
  try {
    console.log(JSON.stringify(obj));
  } catch (e) {
    // fallback minimal
    console.log(JSON.stringify({
      keyId: obj.keyId || null,
      oldVersion: obj.oldVersion || null,
      newVersion: obj.newVersion || null,
      ts: obj.ts || new Date().toISOString()
    }));
  }
}

/**
 * Safe error helper — prints short message to stderr (no secrets).
 */
function fail(msg, code = 1) {
  console.error(JSON.stringify({ error: String(msg) }));
  process.exit(code);
}

async function main() {
  const { keyId } = parseArgs(process.argv);
  if (!keyId) {
    usage();
  }

  const TS = new Date().toISOString();

  // If running as unit tests or for a controlled demo key => simulate
  if (process.env.NODE_ENV === 'test' || keyId === 'unit-test-key') {
    // deterministic simulated response for CI / unit tests
    const simulated = {
      keyId,
      oldVersion: 1,
      newVersion: 2,
      ts: TS,
      simulated: true
    };
    printResultJSON(simulated);
    process.exit(0);
  }

  let adapter;
  try {
    adapter = require('@/lib/kms-adapter');
  } catch (e) {
      fail('KMS adapter not found. Implement it in src/lib/kms-adapter.ts', 20);
  }

  // Validate adapter interface
  if (typeof adapter.rotateKey !== 'function') {
    fail('KMS adapter does not export rotateKey(keyId)', 21);
  }

  try {
    const result = await adapter.rotateKey(keyId);

    const safe = {
      keyId: result.keyId || keyId,
      oldVersion: result.oldVersion,
      newVersion: result.newVersion,
      ts: TS
    };

    printResultJSON(safe);
    process.exit(0);
  } catch (err) {
    fail('Rotation failed: ' + (err && err.message ? err.message : String(err)), 30);
  }
}

main().catch((e) => {
  fail('Unhandled exception: ' + String(e), 99);
});
