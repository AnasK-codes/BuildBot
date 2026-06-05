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
    
    // Return success response and set cookies
    const response = successResponse(data, 200, { requestId });
    
    response.cookies.set('refreshToken', data.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    response.cookies.set('accessToken', data.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    return handleError(error, requestId);
  }
}
