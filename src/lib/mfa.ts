import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { env, requireEnv } from "@/lib/env";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const totpDigits = 6;
const totpStepSeconds = 30;

function base32Encode(input: Uint8Array) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string) {
  const normalized = input.replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) {
      throw new Error("Invalid base32 secret");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits = totpDigits) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);

  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 15;
  const first = digest[offset] ?? 0;
  const second = digest[offset + 1] ?? 0;
  const third = digest[offset + 2] ?? 0;
  const fourth = digest[offset + 3] ?? 0;
  const binary =
    ((first & 127) << 24) | ((second & 255) << 16) | ((third & 255) << 8) | (fourth & 255);

  return String(binary % 10 ** digits).padStart(digits, "0");
}

function compareCodes(expected: string, received: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function resolveEncryptionKey() {
  if (env.MFA_ENCRYPTION_KEY) {
    const key = Buffer.from(env.MFA_ENCRYPTION_KEY, "base64");

    if (key.length !== 32) {
      throw new Error("MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
    }

    return key;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("MFA_ENCRYPTION_KEY is required in production");
  }

  return createHash("sha256").update(requireEnv("AUTH_SECRET")).digest();
}

export function createTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function getMfaIssuer() {
  return env.MFA_ISSUER ?? "Aurelia Private Equity";
}

export function buildOtpAuthUrl(accountName: string, secret: string) {
  const issuer = getMfaIssuer();
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(totpDigits),
    period: String(totpStepSeconds),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

export function verifyTotpCode(secret: string, rawCode: string, window = 1) {
  const code = rawCode.replace(/\s+/g, "");

  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const nowCounter = Math.floor(Date.now() / 1000 / totpStepSeconds);

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = hotp(secret, nowCounter + offset);
    if (compareCodes(expected, code)) {
      return true;
    }
  }

  return false;
}

export function encryptMfaSecret(secret: string) {
  const key = resolveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `v1.${iv.toString("base64")}.${authTag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptMfaSecret(payload: string) {
  const [version, ivBase64, tagBase64, cipherBase64] = payload.split(".");

  if (version !== "v1" || !ivBase64 || !tagBase64 || !cipherBase64) {
    throw new Error("Invalid encrypted MFA payload");
  }

  const key = resolveEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
