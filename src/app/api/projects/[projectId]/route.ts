// ============================================================
// BuildBot — /api/projects/[projectId]
// ============================================================
// GET:    Get project with current version's files
// DELETE: Delete project and all versions
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { projectService } from '@/core/project/project-service';
import { versionService } from '@/core/project/version-service';
import { PreviewBuilder } from '@/core/preview/preview-builder';
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

    const project = await projectService.getProject(user.userId, projectId);

    // Load current version's files
    const versionData = await versionService.getVersionFiles(projectId, project.currentVersion);

    // Build preview HTML
    const previewHtml = PreviewBuilder.assemble(versionData.files);

    return successResponse({
      id: project.id,
      title: project.title,
      prompt: project.prompt,
      status: project.status,
      currentVersion: project.currentVersion,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      files: versionData.files.map(f => ({
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { projectId } = await params;

    await projectService.deleteProject(user.userId, projectId);

    return successResponse({ deleted: true }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
