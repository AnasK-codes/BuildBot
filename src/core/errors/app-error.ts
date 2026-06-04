// ============================================================
// BuildBot — AppError Base Class + Subclasses
// ============================================================
// All application errors extend AppError. This gives us:
//   - Typed error codes
//   - HTTP status codes
//   - Structured details
//   - Stack traces (dev only)
//   - Consistent serialization
// ============================================================

import { ErrorCode } from './error-codes';

// --- Base Error ---

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    details?: Record<string, unknown>,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize to a JSON-safe object for API responses.
   * Stack trace is only included in non-production environments.
   */
  toJSON(requestId?: string) {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(requestId && { requestId }),
        ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// --- Specific Error Classes ---

/**
 * 400 — Input validation failure (Zod, JSON schema, business rules)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * 401 — Authentication failure (missing/invalid/expired token)
 */
export class AuthenticationError extends AppError {
  constructor(
    message = 'Authentication required',
    code: ErrorCode = ErrorCode.AUTHENTICATION_ERROR,
    details?: Record<string, unknown>,
  ) {
    super(message, code, 401, details);
  }
}

/**
 * 403 — Authorization failure (valid token, insufficient permissions)
 */
export class AuthorizationError extends AppError {
  constructor(
    message = 'Insufficient permissions',
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403, details);
  }
}

/**
 * 404 — Resource not found
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string,
  ) {
    const message = identifier
      ? `${resource} '${identifier}' not found`
      : `${resource} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, { resource, identifier });
  }
}

/**
 * 409 — Conflict (duplicate unique value, concurrent modification)
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.CONFLICT, 409, details);
  }
}

/**
 * 500 — Internal server error (unexpected, non-operational)
 */
export class InternalError extends AppError {
  constructor(
    message = 'An unexpected error occurred',
    details?: Record<string, unknown>,
  ) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, details, false);
  }
}
