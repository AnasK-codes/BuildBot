// ============================================================
// BuildBot — Auth Service
// ============================================================
// Core authentication business logic: register, login, refresh.
// This module orchestrates password hashing, token generation,
// and refresh token storage. It does NOT handle HTTP concerns.
// ============================================================

import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from './password-utils';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './jwt-service';
import {
  AuthenticationError,
  ConflictError,
} from '@/core/errors';
import { ErrorCode } from '@/core/errors/error-codes';
import { createModuleLogger } from '@/lib/logger';
import type { SafeUser, TokenPair, RegisterInput, LoginInput } from '@/types/auth.types';

const log = createModuleLogger('auth-service');

// --- Helpers ---

/**
 * Hash a refresh token with SHA-256 before storing in DB.
 * We don't store raw tokens in the database — only hashes.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Strip the passwordHash from a user record for safe API responses.
 */
function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Create a token pair (access + refresh) and persist the
 * refresh token hash in the database.
 */
async function issueTokenPair(user: {
  id: string;
  email: string;
}): Promise<TokenPair> {
  const tokenPayload = { sub: user.id, email: user.email };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Compute expiration date for the refresh token DB record
  const refreshExpiresMs = parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  const expiresAt = new Date(Date.now() + refreshExpiresMs);

  // Store the hash (not the raw token) in the database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  };
}

/**
 * Parse a duration string like "15m", "7d", "1h" into milliseconds.
 */
function parseExpiry(value: string): number {
  const match = value.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

  const num = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

// --- Public API ---

/**
 * Register a new user.
 * @throws ConflictError if the email is already taken
 */
export async function register(
  input: RegisterInput,
): Promise<{ user: SafeUser; tokens: TokenPair }> {
  log.info({ email: input.email }, 'Registering new user');

  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError('A user with this email already exists', {
      field: 'email',
      value: input.email,
    });
  }

  // Hash password and create user
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  // Issue tokens
  const tokens = await issueTokenPair(user);

  log.info({ userId: user.id }, 'User registered successfully');

  return { user: toSafeUser(user), tokens };
}

/**
 * Authenticate an existing user.
 * @throws AuthenticationError if credentials are invalid
 */
export async function login(
  input: LoginInput,
): Promise<{ user: SafeUser; tokens: TokenPair }> {
  log.info({ email: input.email }, 'Login attempt');

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // Use a generic message to prevent email enumeration
    throw new AuthenticationError(
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS,
    );
  }

  // Verify password
  const isValid = await verifyPassword(input.password, user.passwordHash);

  if (!isValid) {
    throw new AuthenticationError(
      'Invalid email or password',
      ErrorCode.INVALID_CREDENTIALS,
    );
  }

  // Issue tokens
  const tokens = await issueTokenPair(user);

  log.info({ userId: user.id }, 'User logged in successfully');

  return { user: toSafeUser(user), tokens };
}

/**
 * Exchange a valid refresh token for a new token pair.
 * The old refresh token is revoked (rotation).
 * @throws AuthenticationError if the refresh token is invalid or revoked
 */
export async function refresh(
  rawRefreshToken: string,
): Promise<{ user: SafeUser; tokens: TokenPair }> {
  log.debug('Refresh token exchange attempt');

  // 1. Verify JWT signature + expiration
  const payload = verifyRefreshToken(rawRefreshToken);

  // 2. Check that the hashed token exists in DB and is not revoked
  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!storedToken) {
    throw new AuthenticationError(
      'Refresh token has been revoked or does not exist',
      ErrorCode.REFRESH_TOKEN_INVALID,
    );
  }

  // 3. Revoke the old token (rotation: one-time use)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // 4. Load user
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new AuthenticationError(
      'User not found',
      ErrorCode.AUTHENTICATION_ERROR,
    );
  }

  // 5. Issue new token pair
  const tokens = await issueTokenPair(user);

  log.info({ userId: user.id }, 'Token refreshed successfully');

  return { user: toSafeUser(user), tokens };
}
