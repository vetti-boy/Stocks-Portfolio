import crypto from 'crypto';

// High-Performance Scope-Cached 32-Byte Key (Zero SHA-256 re-hashing overhead)
let cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;

  const envKey = process.env.ENCRYPTION_KEY || 'stockpulse-pro-secret-encryption-key-2026';
  cachedKey = crypto.createHash('sha256').update(envKey).digest();
  return cachedKey;
}

/**
 * Encrypts payload using hardware-accelerated AES-256-GCM.
 * Output format: "iv_hex:authTag_hex:encrypted_hex"
 */
export function encryptPayload(data: any): string {
  try {
    const key = getEncryptionKey();
    // Standard 96-bit (12-byte) IV for optimal AES-GCM hardware performance
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
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
 * Decrypts AES-256-GCM payload back to JSON object using zero-allocation string slicing.
 */
export function decryptPayload<T = any>(encryptedString: string): T {
  try {
    const key = getEncryptionKey();

    const firstColon = encryptedString.indexOf(':');
    const secondColon = encryptedString.indexOf(':', firstColon + 1);

    if (firstColon === -1 || secondColon === -1) {
      throw new Error('Invalid encrypted payload format.');
    }

    const ivHex = encryptedString.slice(0, firstColon);
    const authTagHex = encryptedString.slice(firstColon + 1, secondColon);
    const encryptedHex = encryptedString.slice(secondColon + 1);

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
