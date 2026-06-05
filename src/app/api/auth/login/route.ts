// ============================================================
// BuildBot — POST /api/auth/login
// ============================================================
// Authenticates a user and returns an access/refresh token pair.
// ============================================================

import { NextRequest } from 'next/server';
import { login } from '@/core/auth';
import { LoginDTO } from '@/types/auth.types';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await req.json();
    
    // Validate request body
    const input = LoginDTO.parse(body);
    
    // Execute business logic
    const data = await login(input);
    
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
