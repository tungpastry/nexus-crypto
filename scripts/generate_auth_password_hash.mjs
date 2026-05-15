#!/usr/bin/env node
import { randomBytes, scryptSync } from "crypto";

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/generate_auth_password_hash.mjs "your-password"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log(`NEXUS_AUTH_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
