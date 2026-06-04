// ============================================================
// BuildBot — /api/ai/refine
// ============================================================
// Applies an AI refinement to an existing app.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { refinementGenerator } from '@/core/ai/refinement/refinement-generator';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const refineSchema = z.object({
  appId: z.string().min(1, 'appId is required'),
  instruction: z.string().min(3, 'Instruction is too short'),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);

    const body = await req.json();
    const result = refineSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.issues });
    }

    const { appId, instruction } = result.data;

    const refinementResult = await refinementGenerator.apply(appId, user.userId, instruction);

    return successResponse({
      appId: refinementResult.appId,
      newVersion: refinementResult.newVersion,
      evolutionSummary: {
        totalChanges: refinementResult.evolutionReport.summary.totalChanges,
        highestSeverity: refinementResult.evolutionReport.summary.highestSeverity,
        safe: refinementResult.evolutionReport.safeChanges.length,
        warnings: refinementResult.evolutionReport.warningChanges.length,
        breaking: refinementResult.evolutionReport.breakingChanges.length,
      },
    }, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
