// ============================================================
// BuildBot — Error Codes Enum
// ============================================================
// Centralized error codes used across the entire application.
// Each code maps to a specific error class and HTTP status.
// Future phases will add METADATA_*, CRUD_*, etc.
// ============================================================

export enum ErrorCode {
  // --- General (1xxx) ---
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // --- Auth (2xxx) ---
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',

  // --- Configuration (reserved for Phase 2+) ---
  // CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  // JSON_PARSE_ERROR = 'JSON_PARSE_ERROR',
  // SCHEMA_VALIDATION_ERROR = 'SCHEMA_VALIDATION_ERROR',
}
