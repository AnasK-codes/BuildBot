// ============================================================
// BuildBot — GET /api/health
// ============================================================
// Unprotected health check endpoint.
// Used for uptime monitoring and readiness probes.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { env } from '@/config/env';

export async function GET(req: NextRequest) {
  try {
    // Check DB connection
    await getPrisma().$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
