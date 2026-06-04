// ============================================================
// BuildBot — Global Error Handler
// ============================================================
// Catches all errors at the API boundary and converts them
// into consistent JSON responses. Used by every API route.
// ============================================================

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import { ErrorCode } from './error-codes';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('error-handler');

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    stack?: string;
    timestamp: string;
  };
}

/**
 * Convert any error into a standardized NextResponse.
 * This is the single exit point for all error responses.
 */
export function handleError(
  error: unknown,
  requestId?: string,
): NextResponse<ErrorResponseBody> {
  // --- Known application error ---
  if (error instanceof AppError) {
    if (!error.isOperational) {
      log.error({ err: error, requestId }, 'Non-operational error');
    } else {
      log.warn({ code: error.code, message: error.message, requestId }, 'Operational error');
    }

    return NextResponse.json(error.toJSON(requestId), {
      status: error.statusCode,
    });
  }

  // --- Zod validation error (from request body parsing) ---
  if (error instanceof ZodError) {
    const details = {
      errors: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };

    log.warn({ details, requestId }, 'Zod validation error');

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Request validation failed',
          details,
          ...(requestId && { requestId }),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 },
    );
  }

  // --- Unknown error (should never happen in healthy code) ---
  const isError = error instanceof Error;

  log.error(
    {
      err: isError ? error : undefined,
      rawError: !isError ? String(error) : undefined,
      requestId,
    },
    'Unhandled error',
  );

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : isError
              ? error.message
              : String(error),
        ...(process.env.NODE_ENV !== 'production' &&
          isError && { stack: error.stack }),
        ...(requestId && { requestId }),
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 },
  );
}
