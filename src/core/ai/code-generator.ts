// ============================================================
// BuildBot — Code Generator Service
// ============================================================
// Main entrypoint for converting a natural language prompt
// into working HTML/CSS/JS files.
// Refactored from the original AIGenerationService — same
// orchestration skeleton, new domain.
// ============================================================

import { ProviderFactory } from './providers/provider-factory';
import { CodeRepairLoop, CodeRepairResult } from './repair-loop';
import { WebPromptBuilder } from './web-prompt-builder';
import { GenerationResult } from '@/types/project.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('code-generator');

export class CodeGenerator {
  private provider = ProviderFactory.getProvider();
  private repairLoop = new CodeRepairLoop(this.provider);

  /**
   * Generates HTML/CSS/JS files from a natural language prompt.
   */
  public async generate(prompt: string): Promise<GenerationResult> {
    log.info({ prompt }, 'Starting code generation');

    const systemPrompt = WebPromptBuilder.buildSystemPrompt();
    const userPrompt = WebPromptBuilder.buildUserPrompt(prompt);
    
    const result = await this.repairLoop.execute(systemPrompt, userPrompt);

    return {
      title: result.parsed?.title ?? 'Untitled Project',
      files: result.files,
      validationReport: result.report,
      success: result.success,
    };
  }
}

export const codeGenerator = new CodeGenerator();
