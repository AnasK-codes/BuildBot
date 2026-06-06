// ============================================================
// BuildBot — POST /api/auth/logout
// ============================================================
// Clears the access and refresh tokens from cookies.
// ============================================================

import { NextRequest } from 'next/server';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  const response = successResponse({ success: true }, 200, { requestId });
  
  // Clear the cookies
  response.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // instantly expire
  });

  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // instantly expire
  });

  return response;
}
