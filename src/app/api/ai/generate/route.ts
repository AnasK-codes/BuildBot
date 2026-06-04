// ============================================================
// BuildBot — /api/ai/generate
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { aiGenerationService } from '@/core/ai/ai-service';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const generateSchema = z.object({
  prompt: z.string().min(3, "Prompt is too short"),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    authenticate(req);
    
    const body = await req.json();
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.issues });
    }
    
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
    
    return successResponse({
      appDefinition: aiResult.appDefinition,
      validationReport: aiResult.report
    }, 201, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
