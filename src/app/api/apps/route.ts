// ============================================================
// BuildBot — /api/apps (Collection)
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { appService } from '@/core/metadata/app-service';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const authContext = authenticate(req);
    const apps = await appService.listAppDefinitions(authContext.userId);
    
    return successResponse({ apps }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const authContext = authenticate(req);
    
    // We expect raw text or JSON, but for app definition validation
    // we want to run the pipeline on the raw JSON string.
    const bodyText = await req.text();
    
    const app = await appService.createAppDefinition(authContext.userId, bodyText);
    
    return successResponse({ app }, 201, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
