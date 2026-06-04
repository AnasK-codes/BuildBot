// ============================================================
// BuildBot — /api/apps/[appId]/seed-status
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { dataSeedingService } from '@/core/ai/data-seeding-service';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const requestId = generateRequestId();

  try {
    authenticate(req);
    const { appId } = params;

    const status = dataSeedingService.getStatus(appId);

    return successResponse(status, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
