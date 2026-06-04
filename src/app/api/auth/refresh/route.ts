// ============================================================
// BuildBot — POST /api/auth/refresh
// ============================================================
// Exchanges a valid refresh token for a new access/refresh pair.
// ============================================================

import { NextRequest } from 'next/server';
import { refresh } from '@/core/auth';
import { RefreshDTO } from '@/types/auth.types';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await req.json();
    
    // Validate request body
    const input = RefreshDTO.parse(body);
    
    // Execute business logic
    const data = await refresh(input.refreshToken);
    
    // Return success response
    return successResponse(data, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
