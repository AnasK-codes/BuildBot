import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// BuildBot — Production Middleware
// ============================================================
// Enforces API Rate Limiting and Request Size Limits.
// Uses an in-memory sliding window for the rate limiter.
// In a true multi-instance deployment, this would connect to Redis.
// ============================================================

const rateLimitCache = new Map<string, { count: number; expiresAt: number }>();

// Configurations
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS_AUTH = 5; // Strict limit for auth routes
const RATE_LIMIT_MAX_REQUESTS_API = 60; // 1 req/sec average for generic APIs

const MAX_PAYLOAD_PROJECT = 5 * 1024 * 1024; // 5MB limit for project payloads

export function middleware(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const path = req.nextUrl.pathname;

  // 1. Request Size Limiting
  const contentLengthHeader = req.headers.get('content-length');
  if (contentLengthHeader && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    const contentLength = parseInt(contentLengthHeader, 10);
    
    // Check Project Routes
    if (path.startsWith('/api/projects')) {
      if (contentLength > MAX_PAYLOAD_PROJECT) {
        return buildErrorResponse('Payload Too Large: Project requests are limited to 5MB', 413);
      }
    }
  }

  // 2. Rate Limiting
  if (path.startsWith('/api/')) {
    const isAuthRoute = path.startsWith('/api/auth/');
    const maxRequests = isAuthRoute ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS_API;
    const cacheKey = `rate_limit:${ip}:${isAuthRoute ? 'auth' : 'api'}`;

    const now = Date.now();
    let record = rateLimitCache.get(cacheKey);

    // Clean up expired or initialize
    if (!record || record.expiresAt < now) {
      record = { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS };
    } else {
      record.count++;
    }

    rateLimitCache.set(cacheKey, record);

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.expiresAt - now) / 1000);
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: { retryAfterSeconds }
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Pass through, attaching rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(maxRequests - record.count));
    return response;
  }

  return NextResponse.next();
}

function buildErrorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message,
      }
    },
    { status }
  );
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};
