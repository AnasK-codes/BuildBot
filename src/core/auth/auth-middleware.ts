// ============================================================
// BuildBot — Auth Middleware
// ============================================================
// Extracts and verifies the JWT from the Authorization header.
// Returns an AuthContext if valid, or throws an error.
// Used by all protected API routes.
// ============================================================

import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt-service';
import { AuthenticationError } from '@/core/errors';
import { ErrorCode } from '@/core/errors/error-codes';
import type { AuthContext } from '@/types/auth.types';

/**
 * Extract and verify the JWT from the request.
 * @throws AuthenticationError if the token is missing, malformed, or invalid
 * @returns AuthContext with the authenticated user's ID and email
 */
export function authenticate(request: NextRequest): AuthContext {
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else {
      throw new AuthenticationError(
        'Authorization header must be in the format: Bearer <token>',
        ErrorCode.AUTHENTICATION_ERROR,
      );
    }
  } else {
    // Fallback to checking the HTTP-only cookie
    const cookie = request.cookies.get('accessToken');
    console.log("=== AUTH DEBUG ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Cookies:", request.cookies.getAll());
    console.log("Token from cookie:", cookie?.value ? "present" : "missing");
    if (cookie) {
      token = cookie.value;
    }
  }

  if (!token) {
    throw new AuthenticationError(
      'Authorization header or accessToken cookie is required',
      ErrorCode.AUTHENTICATION_ERROR,
    );
  }

  // verifyAccessToken throws AuthenticationError on failure
  const payload = verifyAccessToken(token);

  return {
    userId: payload.sub,
    email: payload.email,
  };
}
