// ============================================================
// BuildBot — Validation Repair Loop
// ============================================================
// Executes the AI generation and automatically retries if the
// output fails the ValidationEngine.
// ============================================================

import { ValidationEngine } from '../validation/validation-engine';
import { AIProvider } from './providers/ai-provider';
import { PromptBuilder } from './prompt-builder';
import { AppDefinition, ValidationReport } from '@/types/metadata.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('repair-loop');

export interface RepairLoopResult {
  json: string;
  report: ValidationReport;
  appDefinition: AppDefinition | null;
}

export class ValidationRepairLoop {
  private validationEngine = new ValidationEngine();

  constructor(private provider: AIProvider) {}

  /**
   * Executes the AI generation with up to 3 repair attempts.
   */
  public async execute(systemPrompt: string, userPrompt: string, maxAttempts = 3, isRefinement = false): Promise<RepairLoopResult> {
    let currentAttempt = 1;
    let currentUserPrompt = userPrompt;
    let lastJson = '';
    let lastReport: ValidationReport | null = null;

    while (currentAttempt <= maxAttempts) {
      log.info(`Generation attempt ${currentAttempt}/${maxAttempts}`);
      
      let jsonOutput = '';
      if (currentAttempt === 1) {
        if (isRefinement) {
          jsonOutput = await this.provider.refineSchema(systemPrompt, currentUserPrompt);
        } else {
          jsonOutput = await this.provider.generateSchema(systemPrompt, currentUserPrompt);
        }
      } else {
        jsonOutput = await this.provider.generateRepair(systemPrompt, currentUserPrompt);
      }
      lastJson = jsonOutput;
      
      const validationReport = await this.validationEngine.validateAppDefinition(jsonOutput);
      lastReport = validationReport;

      if (validationReport.valid) {
        log.info('Validation successful.');
        return {
          json: jsonOutput,
          report: validationReport,
          appDefinition: JSON.parse(jsonOutput) as AppDefinition,
        };
      }

      log.warn({ errors: validationReport.errors }, `Validation failed on attempt ${currentAttempt}`);

      if (currentAttempt < maxAttempts) {
        currentUserPrompt = PromptBuilder.buildRepairPrompt(jsonOutput, validationReport.errors);
      }

      currentAttempt++;
    }

    log.error('Max repair attempts reached. Returning invalid result.');
    return {
      json: lastJson,
      report: lastReport!,
      appDefinition: null,
    };
  }
}
