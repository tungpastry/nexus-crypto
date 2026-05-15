import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const HASH_PREFIX = "scrypt";

export function isValidPasswordHashFormat(storedHash: string) {
  const parts = storedHash.split(":");
  return (
    parts.length === 3 &&
    parts[0] === HASH_PREFIX &&
    /^[a-f0-9]+$/i.test(parts[1]) &&
    /^[a-f0-9]+$/i.test(parts[2]) &&
    parts[1].length >= SALT_BYTES * 2 &&
    parts[2].length === KEY_BYTES * 2
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = (await scrypt(password, salt, KEY_BYTES)) as Buffer;
  return `${HASH_PREFIX}:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  try {
    if (!isValidPasswordHashFormat(storedHash)) return false;

    const [, saltHex, hashHex] = storedHash.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;

    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
