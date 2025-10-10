'use client';
/**
 * @fileoverview Funciones de alto nivel para operaciones criptográficas.
 * Este módulo exporta las funciones principales para cifrar y descifrar mnemónicos,
 * utilizando los módulos de derivación de clave y cifrado AES-GCM subyacentes.
 * Prioriza la seguridad y el manejo cuidadoso de los datos sensibles.
 */  

import { deriveKey } from './kdf';
import { aesGcmEncrypt, aesGcmDecrypt } from './aes-gcm';
import { logEvent } from '../logger';
import type { EncryptedPayload } from '../storage/types';
import { getWallet } from "../storage/wallet-db";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Cifra una frase mnemónica con una contraseña.
 * Genera una nueva sal y un nuevo IV para cada operación de cifrado.
 * @param mnemonic La frase mnemónica a cifrar.
 * @param password La contraseña para derivar la clave de cifrado.
 * @returns Una promesa que se resuelve con el objeto EncryptedPayload.
 */
export async function encryptMnemonic(mnemonic: string, password: string): Promise<EncryptedPayload> {
  const mnemonicBuffer = encoder.encode(mnemonic);
  
  const { salt, key } = await deriveKey(password, undefined, ['encrypt']);

  const { ciphertext, iv } = await aesGcmEncrypt(mnemonicBuffer, key);
  
  mnemonicBuffer.fill(0);

  return {
    v: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: 200000,
    salt: Buffer.from(salt).toString('hex'),
    iv: Buffer.from(iv).toString('hex'),
    ct: Buffer.from(ciphertext).toString('base64'),
  };
}

/**
 * Descifra un blob cifrado usando una contraseña.
 * @param enc El objeto EncryptedPayload o un JSON string que contiene los datos cifrados.
 * @param password La contraseña para derivar la clave de descifrado.
 * @returns Una promesa que se resuelve con la frase mnemónica en texto plano.
 * @throws Si la contraseña es incorrecta o los datos están corruptos.
 */
export async function decryptMnemonic(enc: EncryptedPayload | string, password: string): Promise<string> {
    if (typeof window === 'undefined') {
        throw new Error('La criptografía del lado del cliente solo puede ejecutarse en el navegador.');
    }
    try {
        const data: EncryptedPayload = typeof enc === 'string' ? JSON.parse(enc) : enc;

        const salt = Buffer.from(data.salt, 'hex');
        const iv = Buffer.from(data.iv, 'hex');
        const ciphertext = Buffer.from(data.ct, 'base64');
        
        const { key } = await deriveKey(password, salt, ['decrypt'], data.iterations || 200000);

        // CORRECCIÓN: Convierte el Buffer de Node.js a ArrayBuffer para satisfacer la API Web Crypto.
        // ArrayBuffer se extrae con .buffer y se ajusta con slice.
        const ciphertextBuffer = ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength);

        const decryptedBuffer = await aesGcmDecrypt(ciphertextBuffer, iv, key);
        const mnemonic = decoder.decode(decryptedBuffer);
        
        // @ts-ignore
        if (decryptedBuffer.fill) {
            // @ts-ignore
            decryptedBuffer.fill(0); // Limpieza del buffer descifrado
        }

        return mnemonic;
    } catch (error: any) {
        logEvent('decrypt_mnemonic_failed', { reason: error.message });
        throw new Error('Contraseña incorrecta o datos corruptos.');
    }
}


/**
 * Cambia la contraseña de un blob cifrado.
 * @param oldEnc El blob cifrado actual.
 * @param oldPassword La contraseña antigua para descifrar el blob.
 * @param newPassword La nueva contraseña para volver a cifrar.
 * @returns Una promesa que se resuelve con el nuevo EncryptedPayload.
 */
export async function changePassword(oldEnc: EncryptedPayload | string, oldPassword: string, newPassword: string): Promise<EncryptedPayload> {
    const mnemonic = await decryptMnemonic(oldEnc, oldPassword);
    const newEncryptedBlob = await encryptMnemonic(mnemonic, newPassword);
    return newEncryptedBlob;
}
