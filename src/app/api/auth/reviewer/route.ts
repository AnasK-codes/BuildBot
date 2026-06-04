// ============================================================
// BuildBot — /api/auth/reviewer
// ============================================================
// Logs in the seeded reviewer account for one-click access.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/core/auth/auth-service';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Attempt to log in the reviewer account with the hardcoded seed password
    const result = await login({ email: 'reviewer@buildbot.local', password: 'reviewer123!' });
    
    // We need to set the HTTP-only cookie since this is a Next.js route handler
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        // We still return tokens in body for client use if needed, but cookie is primary
        accessToken: result.tokens.accessToken,
      }
    }, { status: 200, headers: { 'x-request-id': requestId } });

    // Set refresh token as HTTP-only cookie
    response.cookies.set('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
    
    response.cookies.set('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    });

    return response;
  } catch (error) {
    return handleError(error, requestId);
  }
}
