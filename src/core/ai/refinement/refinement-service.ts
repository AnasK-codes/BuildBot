// ============================================================
// BuildBot — Refinement Service
// ============================================================
// Orchestrates the full AI refinement pipeline:
// Load Files → Prompt → AI → Validate → Persist New Version
// Refactored from the original RefinementGenerator — same
// version-aware lifecycle, new domain.
// ============================================================

import { RefinementPromptBuilder } from './refinement-prompt-builder';
import { ProviderFactory } from '../providers/provider-factory';
import { CodeRepairLoop } from '../repair-loop';
import { projectService } from '../../project/project-service';
import { versionService } from '../../project/version-service';
import { GeneratedFileData } from '@/types/project.types';
import { getPrisma } from '@/lib/prisma';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('refinement-service');

export interface RefinementResult {
  projectId: string;
  newVersion: number;
  files: GeneratedFileData[];
  title: string;
}

export class RefinementService {
  private provider = ProviderFactory.getProvider();
  private repairLoop = new CodeRepairLoop(this.provider);

  /**
   * Execute the full refinement: load current files, generate updated
   * code via AI, validate, persist as new version.
   * Reuses the version-aware lifecycle from the original RefinementGenerator.
   */
  public async apply(projectId: string, userId: string, instruction: string): Promise<RefinementResult> {
    log.info({ projectId, instruction }, 'Starting refinement');

    // 1. Load current version's files
    const project = await projectService.getProjectWithFiles(userId, projectId);
    const currentVersionData = project.versions[0]; // Most recent version (ordered desc)

    if (!currentVersionData || !currentVersionData.files.length) {
      throw new Error(`No files found for project ${projectId}`);
    }

    const currentFiles = currentVersionData.files.map(f => ({
      path: f.path,
      content: f.content,
    }));

    // 2. Generate refined code via AI + validation
    const systemPrompt = RefinementPromptBuilder.buildSystemPrompt();
    const userPrompt = RefinementPromptBuilder.buildUserPrompt(currentFiles, instruction);

    const result = await this.repairLoop.execute(systemPrompt, userPrompt, 3, true);

    if (!result.success || !result.parsed) {
      throw new Error(`Refinement failed validation after repair attempts. Errors: ${JSON.stringify(result.report.errors)}`);
    }

    // 3. Persist as new version
    const newVersionNumber = project.currentVersion + 1;

    await versionService.createVersion(
      projectId,
      newVersionNumber,
      instruction,
      result.files,
      project.currentVersion,
      result.report,
    );

    // 4. Update project to point to new version
    await projectService.setCurrentVersion(projectId, newVersionNumber);

    log.info({ projectId, newVersion: newVersionNumber }, 'Refinement persisted');

    return {
      projectId,
      newVersion: newVersionNumber,
      files: result.files,
      title: result.parsed.title ?? project.title,
    };
  }
}

export const refinementService = new RefinementService();
