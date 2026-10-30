import crypto from 'crypto';

let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  const envKey = process.env.ENCRYPTION_KEY || 'stockpulse-pro-secret-encryption-key-2026';
  cachedKey = crypto.createHash('sha256').update(envKey).digest();
  return cachedKey;
}

/**
 * Direct plain data handler (Encryption disabled as requested).
 * Returns raw payload object/data without AES overhead.
 */
export function encryptPayload(data: any): any {
  return data;
}

/**
 * Direct plain data handler with legacy AES-256-GCM fallback.
 * Returns raw payload object or parses string/legacy data.
 */
export function decryptPayload<T = any>(payload: any): T {
  if (!payload) return null as unknown as T;
  if (typeof payload === 'object') return payload as T;

  if (typeof payload === 'string') {
    // Check if payload is legacy encrypted string format "iv:authTag:cipher"
    if (payload.includes(':')) {
      try {
        const key = getEncryptionKey();
        const firstColon = payload.indexOf(':');
        const secondColon = payload.indexOf(':', firstColon + 1);

        if (firstColon !== -1 && secondColon !== -1) {
          const ivHex = payload.slice(0, firstColon);
          const authTagHex = payload.slice(firstColon + 1, secondColon);
          const encryptedHex = payload.slice(secondColon + 1);

          const iv = Buffer.from(ivHex, 'hex');
          const authTag = Buffer.from(authTagHex, 'hex');

          const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(authTag);

          let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
          decrypted += decipher.final('utf8');

          return JSON.parse(decrypted) as T;
        }
      } catch {
        // Fallback to JSON parse
      }
    }

    try {
      return JSON.parse(payload) as T;
    } catch {
      return payload as unknown as T;
    }
  }

  return payload as T;
}
