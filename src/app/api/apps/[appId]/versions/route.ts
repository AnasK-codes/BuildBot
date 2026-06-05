// ============================================================
// BuildBot — /api/apps/[appId]/versions
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { getPrisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const requestId = generateRequestId();

  try {
    authenticate(req);
    const { appId } = await params;

    const app = await getPrisma().appDefinition.findUnique({
      where: { id: appId },
      select: { 
        id: true, 
        appName: true, 
        version: true, 
        status: true, 
        createdAt: true, 
        updatedAt: true,
        versionHistory: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!app) {
      return new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'App not found' } }), { status: 404 });
    }

    return successResponse({
      appId: app.id,
      appName: app.appName,
      currentVersion: app.version,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      history: app.versionHistory,
    }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
