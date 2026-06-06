// ============================================================
// BuildBot — /api/projects/[projectId]/refine
// ============================================================
// POST: Refine a project with a new instruction
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { refinementService } from '@/core/ai/refinement/refinement-service';
import { PreviewBuilder } from '@/core/preview/preview-builder';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const refineSchema = z.object({
  instruction: z.string().min(3, 'Instruction is too short'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { projectId } = await params;

    const body = await req.json();
    const result = refineSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.issues });
    }

    const refinement = await refinementService.apply(
      projectId,
      user.userId,
      result.data.instruction,
    );

    // Build preview HTML from new files
    const previewHtml = PreviewBuilder.assemble(refinement.files);

    return successResponse({
      projectId: refinement.projectId,
      version: refinement.newVersion,
      title: refinement.title,
      files: refinement.files.map((f: { path: string; content: string; language: string; sizeBytes: number }) => ({
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
