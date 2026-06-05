// ============================================================
// BuildBot — /api/projects/[projectId]/versions/[version]/rollback
// ============================================================
// POST: Rollback to a specific version
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { projectService } from '@/core/project/project-service';
import { versionService } from '@/core/project/version-service';
import { PreviewBuilder } from '@/core/preview/preview-builder';
import { handleError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; version: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { projectId, version } = await params;
    const targetVersion = parseInt(version, 10);

    if (isNaN(targetVersion)) {
      throw new Error('Invalid version number');
    }

    // Verify ownership
    await projectService.getProject(user.userId, projectId);

    // Rollback (moves pointer)
    const project = await versionService.rollback(projectId, targetVersion);

    // Get files for the target version
    const versionData = await versionService.getVersionFiles(projectId, targetVersion);

    // Build preview HTML
    const previewHtml = PreviewBuilder.assemble(versionData.files);

    return successResponse({
      projectId: project.id,
      currentVersion: project.currentVersion,
      files: versionData.files.map((f: any) => ({
        path: f.path,
        content: f.content,
        language: f.language,
        sizeBytes: f.sizeBytes,
      })),
      previewHtml,
    }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
