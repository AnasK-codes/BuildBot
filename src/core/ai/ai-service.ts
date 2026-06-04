// ============================================================
// BuildBot — AI Generation Service
// ============================================================
// Main entrypoint for converting a natural language prompt
// into a valid AppDefinition.
// ============================================================

import { SchemaGenerator } from './schema-generator';
import { ValidationRepairLoop, RepairLoopResult } from './repair-loop';
import { PromptBuilder } from './prompt-builder';

export class AIGenerationService {
  private schemaGenerator = new SchemaGenerator();
  private repairLoop = new ValidationRepairLoop(this.schemaGenerator);

  /**
   * Generates a new AppDefinition from scratch based on a prompt.
   */
  public async generateAppDefinition(prompt: string): Promise<RepairLoopResult> {
    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = `Please generate an application schema for the following request:\n"${prompt}"\nOutput RAW JSON ONLY.`;
    
    return this.repairLoop.execute(systemPrompt, userPrompt);
  }
}

export const aiGenerationService = new AIGenerationService();
