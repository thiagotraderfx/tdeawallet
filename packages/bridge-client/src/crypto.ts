// NOTE: This is a direct copy of the crypto logic from the wallet side.
// In a real monorepo, this would be a shared internal package.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function base64UrlEncode(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString('base64url');
}

export function base64UrlDecode(str: string): Uint8Array {
    return Buffer.from(str, 'base64url');
}


export async function generateEphemeralKeys(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'X25519' },
        true,
        ['deriveKey', 'deriveBits']
    );
}

export async function exportKey(key: CryptoKey): Promise<Uint8Array> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(exported);
}

export async function importPublicKey(keyData: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'ECDH', namedCurve: 'X25519' },
        true,
        []
    );
}

export async function deriveSharedSecret(privateKey: CryptoKey, theirPublicKey: CryptoKey, salt: Uint8Array, info: string): Promise<CryptoKey> {
    const ikm = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: theirPublicKey },
        privateKey,
        256
    );

    const baseKey = await crypto.subtle.importKey(
        'raw',
        ikm,
        { name: 'HKDF' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            salt: salt,
            info: encoder.encode(info),
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

function buildAdditionalData(sessionId: string, senderPublicKey: string, counter: number): Uint8Array {
    return encoder.encode(`${sessionId}|${senderPublicKey}|${counter}`);
}

export async function encryptPayload(sharedKey: CryptoKey, payload: object, sessionId: string, senderPublicKey: string, counter: number): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payloadString = JSON.stringify(payload);
    const payloadBuffer = encoder.encode(payloadString);

    const additionalData = buildAdditionalData(sessionId, senderPublicKey, counter);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, additionalData },
        sharedKey,
        payloadBuffer
    );
    return { ciphertext, iv };
}

export async function decryptPayload<T>(sharedKey: CryptoKey, payload: { ct: string, iv: string, senderPub: string, counter: number }, sessionId: string): Promise<{ decrypted: T, counter: number }> {
    const ciphertext = base64UrlDecode(payload.ct);
    const iv = base64UrlDecode(payload.iv);

    const additionalData = buildAdditionalData(sessionId, payload.senderPub, payload.counter);

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, additionalData },
        sharedKey,
        ciphertext
    );

    const decryptedString = decoder.decode(decryptedBuffer);
    const decrypted = JSON.parse(decryptedString) as T;

    if (typeof payload.counter !== 'number') {
        throw new Error('Invalid counter in decrypted payload.');
    }
    
    return { decrypted: decrypted, counter: payload.counter };
}
