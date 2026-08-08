import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_COST_FACTOR = 16384;

export class PasswordHasher {
  hash(plainText: string): string {
    const salt = randomBytes(16);
    const derivedKey = scryptSync(plainText, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_COST_FACTOR,
    });
    return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
  }

  verify(plainText: string, storedHash: string): boolean {
    const [saltHex, keyHex] = storedHash.split(":");
    if (!saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    const derivedKey = scryptSync(plainText, salt, SCRYPT_KEY_LENGTH, {
      N: SCRYPT_COST_FACTOR,
    });

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  }
}
