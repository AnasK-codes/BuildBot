// ============================================================
// BuildBot — Password Utilities
// ============================================================
// bcrypt-based password hashing with secure defaults.
// Cost factor 12 provides ~250ms hash time on modern hardware,
// a good balance between security and user experience.
// ============================================================

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt.
 * @returns The bcrypt hash string (includes salt + algorithm prefix)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 * Uses constant-time comparison to prevent timing attacks.
 * @returns true if the password matches the hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
