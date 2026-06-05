// ============================================================
// BuildBot — Code Repair Loop
// ============================================================
// Executes the AI code generation and automatically retries if
// the output fails the CodeValidator. Adapted from the original
// ValidationRepairLoop — same control flow, new domain.
// ============================================================

import { CodeValidator } from '../validation/code-validator';
import { AIProvider } from './providers/ai-provider';
import { WebPromptBuilder } from './web-prompt-builder';
import { sanitizeJsonResponse } from './utils/json-sanitizer';
import { AIGenerationOutput, CodeValidationReport, GeneratedFileData } from '@/types/project.types';
import { createModuleLogger } from '@/lib/logger';
import { createHash } from 'crypto';

const log = createModuleLogger('repair-loop');

export interface CodeRepairResult {
  parsed: AIGenerationOutput | null;
  files: GeneratedFileData[];
  report: CodeValidationReport;
  success: boolean;
}

/**
 * Maps a file path to its language identifier.
 */
function detectLanguage(path: string): string {
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.js')) return 'javascript';
  return 'text';
}

/**
 * Converts raw AI file output into enriched GeneratedFileData with checksums.
 */
function enrichFiles(rawFiles: Array<{ path: string; content: string }>): GeneratedFileData[] {
  return rawFiles.map(f => ({
    path: f.path,
    content: f.content,
    language: detectLanguage(f.path),
    sizeBytes: Buffer.byteLength(f.content, 'utf-8'),
    checksum: createHash('sha256').update(f.content).digest('hex'),
  }));
}

export class CodeRepairLoop {
  private codeValidator = new CodeValidator();

  constructor(private provider: AIProvider) {}

  /**
   * Executes the AI generation with up to 3 repair attempts.
   * Structural skeleton reused from the original ValidationRepairLoop.
   */
  public async execute(systemPrompt: string, userPrompt: string, maxAttempts = 3, isRefinement = false): Promise<CodeRepairResult> {
    let currentAttempt = 1;
    let currentUserPrompt = userPrompt;
    let lastJson = '';
    let lastReport: CodeValidationReport | null = null;

    while (currentAttempt <= maxAttempts) {
      log.info(`Generation attempt ${currentAttempt}/${maxAttempts}`);
      
      let jsonOutput = '';
      if (currentAttempt === 1) {
        if (isRefinement) {
          jsonOutput = await this.provider.refineCode(systemPrompt, currentUserPrompt);
        } else {
          jsonOutput = await this.provider.generateCode(systemPrompt, currentUserPrompt);
        }
      } else {
        jsonOutput = await this.provider.repairCode(systemPrompt, currentUserPrompt);
      }
      lastJson = sanitizeJsonResponse(jsonOutput);
      
      const validationReport = this.codeValidator.validate(lastJson);
      lastReport = validationReport;

      if (validationReport.valid) {
        log.info('Validation successful.');
        const parsed = JSON.parse(lastJson) as AIGenerationOutput;
        return {
          parsed,
          files: enrichFiles(parsed.files),
          report: validationReport,
          success: true,
        };
      }

      log.warn({ errors: validationReport.errors }, `Validation failed on attempt ${currentAttempt}`);

      if (currentAttempt < maxAttempts) {
        currentUserPrompt = WebPromptBuilder.buildRepairPrompt(lastJson, validationReport.errors);
      }

      currentAttempt++;
    }

    log.error('Max repair attempts reached. Returning invalid result.');
    return {
      parsed: null,
      files: [],
      report: lastReport!,
      success: false,
    };
  }
}
