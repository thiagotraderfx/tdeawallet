const SENSITIVE_KEYS = ['mnemonic', 'sk', 'secretKey', 'privateKey', 'rawSecret', 'password'];

/**
 * Sanitiza un payload eliminando claves sensibles conocidas.
 * @param payload El objeto a sanitizar.
 * @returns Un nuevo objeto sin las claves sensibles.
 */
function sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const key in payload) {
        if (!SENSITIVE_KEYS.includes(key) && payload[key] !== undefined) {
             if (typeof payload[key] === 'object' && payload[key] !== null && !Array.isArray(payload[key])) {
                sanitized[key] = sanitizePayload(payload[key]);
            } else {
                sanitized[key] = payload[key];
            }
        }
    }
    return sanitized;
}

/**
 * Registra un evento de forma segura, asegurando que no se fuguen datos sensibles.
 * @param name Nombre del evento (ej: 'tx_sent').
 * @param payload Datos asociados al evento.
 */
export function logEvent(name: string, payload: Record<string, any>): void {
    const sanitized = sanitizePayload(payload);
    // Para evitar problemas con BigInt en JSON.stringify
    const sanitizedStr = JSON.stringify(sanitized, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    );
    console.log(`Event tracked: ${name} ${sanitizedStr}`);
}
