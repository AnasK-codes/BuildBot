// ============================================================
// BuildBot — /api/projects
// ============================================================
// POST: Generate a new project from a prompt
// GET:  List user's projects
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { CodeGenerator } from '@/core/ai/code-generator';
import { projectService } from '@/core/project/project-service';
import { versionService } from '@/core/project/version-service';
import { handleError, ValidationError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { z } from 'zod';

const createSchema = z.object({
  prompt: z.string().min(3, 'Prompt is too short'),
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);

    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', { errors: result.error.issues });
    }

    const { prompt } = result.data;

    // 1. Generate code via AI pipeline
    const codeGenerator = new CodeGenerator();
    const genResult = await codeGenerator.generate(prompt);

    if (!genResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'AI failed to generate valid code after multiple attempts.',
          details: {
            report: genResult.validationReport,
          },
        },
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Create project record
    const project = await projectService.createProject(user.userId, genResult.title, prompt);

    // 3. Create version 1 with files
    await versionService.createVersion(
      project.id,
      1,
      prompt,
      genResult.files,
      undefined,
      genResult.validationReport,
    );

    // 4. Mark project as READY
    await projectService.markReady(project.id, 1);

    return successResponse({
      projectId: project.id,
      title: genResult.title,
      version: 1,
      status: 'READY',
      files: genResult.files.map(f => ({
        path: f.path,
        language: f.language,
        sizeBytes: f.sizeBytes,
      })),
    }, 201, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const projects = await projectService.listProjects(user.userId);
    return successResponse(projects, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
