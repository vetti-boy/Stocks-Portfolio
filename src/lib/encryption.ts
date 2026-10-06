import crypto from 'crypto';

// Default 32-byte secret key for local development fallback
const DEFAULT_KEY = crypto.createHash('sha256').update('stockpulse-pro-secret-encryption-key-2026').digest();

function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    return DEFAULT_KEY;
  }
  // Ensure key is exactly 32 bytes (256 bits)
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts any JSON-serializable payload using AES-256-GCM.
 * Output format: "iv_hex:authTag_hex:encrypted_hex"
 */
export function encryptPayload(data: any): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const jsonString = JSON.stringify(data);
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Failed to encrypt user payload.');
  }
}

/**
 * Decrypts AES-256-GCM encrypted string back to JSON object.
 */
export function decryptPayload<T = any>(encryptedString: string): T {
  try {
    const key = getEncryptionKey();
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format.');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as T;
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Failed to decrypt user payload. Invalid key or corrupted data.');
  }
}
