// ============================================================
// BuildBot — /api/ai/create
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { aiGenerationService } from '@/core/ai/ai-service';
import { draftAppService } from '@/core/ai/draft-app-service';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const createSchema = z.object({
  prompt: z.string().min(3, "Prompt is too short"),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const user = authenticate(req);
    
    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.errors });
    }
    
    // Generate Domain Metadata via AI pipeline
    const aiResult = await aiGenerationService.generateAppDefinition(result.data.prompt);
    
    if (!aiResult.report.valid) {
      // 422 Unprocessable Entity if it still failed after repairs
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'AI failed to generate a valid schema after multiple attempts.',
          details: {
            report: aiResult.report,
            partialJson: aiResult.json,
          }
        }
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Persist as a DRAFT application
    const { summary } = await draftAppService.createDraftApp(
      user.userId,
      aiResult.json,
      aiResult.archetype
    );
    
    return successResponse(summary, 201, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
