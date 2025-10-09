
/**
 * @fileoverview Implementación de la Función de Derivación de Clave (KDF) usando PBKDF2.
 * Utiliza la API Web Crypto (SubtleCrypto) para derivar de forma segura una clave de cifrado
 * a partir de una contraseña proporcionada por el usuario.
 */

const KDF_ITERATIONS = 200000;
const KDF_HASH = 'SHA-256';
const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Deriva una clave de cifrado a partir de una contraseña y una sal.
 * @param password La contraseña del usuario.
 * @param salt Una sal para la derivación. Si no se proporciona, se genera una nueva sal de 16 bytes.
 * @param keyUsages Los usos permitidos para la clave derivada (ej. ['encrypt', 'decrypt']).
 * @returns Una promesa que se resuelve con la CryptoKey derivada y la sal utilizada.
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array | undefined,
  keyUsages: KeyUsage[],
  iterations: number = KDF_ITERATIONS
): Promise<{ key: CryptoKey; salt: Uint8Array, iterations: number }> {
  if (typeof window === 'undefined') {
    throw new Error('La criptografía del lado del cliente solo puede ejecutarse en el navegador.');
  }
  const passwordBuffer = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false, // No se puede extraer la clave base
    ['deriveKey']
  );

  const effectiveSalt = salt || crypto.getRandomValues(new Uint8Array(16));

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: effectiveSalt,
      iterations: iterations,
      hash: KDF_HASH,
    },
    keyMaterial,
    { name: KEY_ALGORITHM, length: KEY_LENGTH },
    false, // La clave derivada NO debe ser extraíble
    keyUsages
  );

  return { key, salt: effectiveSalt, iterations };
}
