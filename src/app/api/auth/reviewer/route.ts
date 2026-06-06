import { NextRequest } from 'next/server';
import { login } from '@/core/auth';
import { LoginDTO } from '@/types/auth.types';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const input = LoginDTO.parse({
      email: 'reviewer@buildbot.local',
      password: 'reviewer123!'
    });
    
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
