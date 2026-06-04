// ============================================================
// BuildBot — Auth Types
// ============================================================
// All authentication-related type definitions.
// Used across auth service, middleware, and API routes.
// ============================================================

import { z } from 'zod';

// --- Database User (what Prisma returns) ---

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Safe User (no password hash — returned in responses) ---

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- JWT Payload (encoded in the access token) ---

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  iat?: number;      // issued at (set by jsonwebtoken)
  exp?: number;      // expiration (set by jsonwebtoken)
}

// --- Auth Context (injected into protected routes) ---

export interface AuthContext {
  userId: string;
  email: string;
}

// --- Token Pair (returned after login/register/refresh) ---

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// --- Request DTOs (Zod schemas for input validation) ---

export const RegisterDTO = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .transform((v) => v.trim()),
});

export type RegisterInput = z.infer<typeof RegisterDTO>;

export const LoginDTO = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginDTO>;

export const RefreshDTO = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export type RefreshInput = z.infer<typeof RefreshDTO>;
