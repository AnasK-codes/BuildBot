// ============================================================
// BuildBot — /api/projects/[projectId]/versions
// ============================================================
// GET: List all versions for a project
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { projectService } from '@/core/project/project-service';
import { versionService } from '@/core/project/version-service';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { projectId } = await params;

    // Verify ownership
    await projectService.getProject(user.userId, projectId);

    const versions = await versionService.listVersions(projectId);

    return successResponse(versions, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
