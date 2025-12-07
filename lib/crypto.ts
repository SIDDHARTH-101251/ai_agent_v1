import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const IV_LENGTH = 12; // AES-GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const raw = process.env.USER_KEY_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("USER_KEY_ENCRYPTION_KEY is not set");
  }
  // Derive a 32-byte key via SHA-256 so callers can provide any reasonably random string.
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const key = getKey();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[decryptSecret]", err);
    return null;
  }
}
