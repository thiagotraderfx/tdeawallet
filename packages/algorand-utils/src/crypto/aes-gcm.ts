/**
 * @fileoverview Implementación del cifrado y descifrado usando AES-GCM.
 * Utiliza la API Web Crypto (SubtleCrypto) para un rendimiento nativo y seguro.
 */

/**
 * Cifra un buffer de datos usando AES-GCM.
 * @param data El buffer de datos (Uint8Array) a cifrar.
 * @param key La CryptoKey (AES-GCM) para el cifrado.
 * @returns Una promesa que se resuelve con el texto cifrado (ciphertext) y el vector de inicialización (iv).
 */
export async function aesGcmEncrypt(data: Uint8Array, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits es óptimo para AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  return { ciphertext, iv };
}

/**
 * Descifra datos usando AES-GCM.
 * @param ciphertext El buffer de datos cifrados.
 * @param iv El vector de inicialización utilizado durante el cifrado.
 * @param key La CryptoKey (AES-GCM) para el descifrado.
 * @returns Una promesa que se resuelve con el buffer de datos descifrados.
 * @throws Si la etiqueta de autenticación no es válida (indica datos corruptos o clave incorrecta).
 */
export async function aesGcmDecrypt(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
}
