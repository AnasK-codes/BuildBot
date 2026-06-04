// ============================================================
// BuildBot — /api/apps/[appId]/publish
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { AppDefinitionService } from '@/core/metadata/app-service';
import { handleError, NotFoundError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import prisma from '@/lib/prisma';

const appService = new AppDefinitionService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { appId } = await params;

    const app = await appService.getAppDefinition(user.userId, appId);

    if (!app) {
      throw new NotFoundError(`Application ${appId} not found`);
    }

    if (app.status === 'ACTIVE') {
      throw new ValidationError('Application is already published and active');
    }
    
    if (app.status !== 'DRAFT') {
      throw new ValidationError(`Cannot publish application in status: ${app.status}`);
    }

    // Update status to ACTIVE
    await prisma.appDefinition.update({
      where: {
        id: appId,
        userId: user.userId, // extra safety
      },
      data: {
        status: 'ACTIVE'
      }
    });

    return successResponse({
      appId: app.id,
      appName: app.appName,
      status: 'ACTIVE',
      version: app.version
    }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
