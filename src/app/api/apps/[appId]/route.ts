// ============================================================
// BuildBot — /api/apps/[appId] (Single)
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { appService } from '@/core/metadata/app-service';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

interface Params {
  params: Promise<{ appId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  
  try {
    const authContext = authenticate(req);
    const resolvedParams = await params;
    
    const app = await appService.getAppDefinition(authContext.userId, resolvedParams.appId);
    
    return successResponse({ app }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  
  try {
    const authContext = authenticate(req);
    const resolvedParams = await params;
    const bodyText = await req.text();
    
    const app = await appService.updateAppDefinition(
      authContext.userId, 
      resolvedParams.appId, 
      bodyText
    );
    
    return successResponse({ app }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  
  try {
    const authContext = authenticate(req);
    const resolvedParams = await params;
    
    await appService.deleteAppDefinition(authContext.userId, resolvedParams.appId);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error, requestId);
  }
}
