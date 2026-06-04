// ============================================================
// BuildBot — /api/ai/refine/preview
// ============================================================
// Generates a refinement preview without persisting changes.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { refinementGenerator } from '@/core/ai/refinement/refinement-generator';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const previewSchema = z.object({
  appId: z.string().min(1, 'appId is required'),
  instruction: z.string().min(3, 'Instruction is too short'),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    authenticate(req);

    const body = await req.json();
    const result = previewSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.issues });
    }

    const { appId, instruction } = result.data;
    const preview = await refinementGenerator.preview(appId, instruction);

    return successResponse(preview, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
