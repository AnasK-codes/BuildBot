// ============================================================
// BuildBot — POST /api/auth/register
// ============================================================
// Registers a new user and returns an access/refresh token pair.
// ============================================================

import { NextRequest } from 'next/server';
import { register } from '@/core/auth';
import { RegisterDTO } from '@/types/auth.types';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await req.json();
    
    // Validate request body
    const input = RegisterDTO.parse(body);
    
    // Execute business logic
    const data = await register(input);
    
    // Return success response (201 Created) and set cookies
    const response = successResponse(data, 201, { requestId });
    
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
