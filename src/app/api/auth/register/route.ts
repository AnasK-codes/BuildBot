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
    
    // Return success response (201 Created)
    return successResponse(data, 201, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
