// ============================================================
// BuildBot — API Response Types
// ============================================================
// Standardized response envelope used by every API route.
// Ensures all responses have the same shape regardless of
// the endpoint.
// ============================================================

// --- Success Response ---

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

// --- Error Response ---

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

// --- Combined Type ---

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// --- Pagination Meta ---

export interface PaginationMeta {
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

// --- Response Meta ---

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  pagination?: PaginationMeta;
}
