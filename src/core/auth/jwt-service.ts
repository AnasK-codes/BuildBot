// ============================================================
// BuildBot — JWT Service
// ============================================================
// Issues and verifies JWT access and refresh tokens.
// Access tokens are short-lived (15m default).
// Refresh tokens are longer-lived (7d default) and are
// stored hashed in the database for revocation support.
// ============================================================

import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AuthenticationError } from '@/core/errors';
import { ErrorCode } from '@/core/errors/error-codes';
import type { JWTPayload } from '@/types/auth.types';

// --- Access Token ---

/**
 * Generate a short-lived JWT access token.
 */
export function generateAccessToken(payload: {
  sub: string;
  email: string;
}): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT access token.
 * @throws AuthenticationError if the token is invalid or expired
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError(
        'Access token has expired',
        ErrorCode.TOKEN_EXPIRED,
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError(
        'Invalid access token',
        ErrorCode.TOKEN_INVALID,
      );
    }
    throw new AuthenticationError(
      'Token verification failed',
      ErrorCode.TOKEN_INVALID,
    );
  }
}

// --- Refresh Token ---

/**
 * Generate a longer-lived JWT refresh token.
 * The raw token is returned to the client.
 * The hash of this token is stored in the database.
 */
export function generateRefreshToken(payload: {
  sub: string;
  email: string;
}): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT refresh token.
 * @throws AuthenticationError if the token is invalid or expired
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError(
        'Refresh token has expired',
        ErrorCode.REFRESH_TOKEN_EXPIRED,
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError(
        'Invalid refresh token',
        ErrorCode.REFRESH_TOKEN_INVALID,
      );
    }
    throw new AuthenticationError(
      'Refresh token verification failed',
      ErrorCode.REFRESH_TOKEN_INVALID,
    );
  }
}
