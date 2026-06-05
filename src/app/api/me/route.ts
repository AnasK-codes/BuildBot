// ============================================================
// BuildBot — GET /api/me
// ============================================================
// Protected endpoint example. Returns the authenticated user.
// Demonstrates how to use the authenticate() middleware function.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { getPrisma } from '@/lib/prisma';
import { handleError, NotFoundError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // 1. Authenticate the request
    const authContext = authenticate(req);
    
    // 2. Load user data
    const user = await getPrisma().user.findUnique({
      where: { id: authContext.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // specifically omit passwordHash
      },
    });
    
    if (!user) {
      throw new NotFoundError('User', authContext.userId);
    }
    
    // 3. Return success
    return successResponse({ user }, 200, { requestId });
  } catch (error) {
    // All AuthErrors (missing/invalid tokens) are handled gracefully here
    return handleError(error, requestId);
  }
}
