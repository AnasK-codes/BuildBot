// ============================================================
// BuildBot — Response Helpers
// ============================================================
// Factory functions for creating consistent API responses.
// Every route should use these instead of raw NextResponse.json().
// ============================================================

import { NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';
import type { SuccessResponse, ResponseMeta } from '@/types/api.types';

/**
 * Create a success response with the standard envelope.
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: Partial<ResponseMeta>,
): NextResponse<SuccessResponse<T>> {
  const responseMeta: ResponseMeta = {
    timestamp: new Date().toISOString(),
    ...meta,
  };

  return NextResponse.json(
    {
      success: true as const,
      data,
      meta: responseMeta,
    },
    { status },
  );
}

/**
 * Generate a unique request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${createId()}`;
}
