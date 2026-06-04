// ============================================================
// BuildBot — AI Generation Service
// ============================================================
// Main entrypoint for converting a natural language prompt
// into a valid AppDefinition.
// ============================================================

import { SchemaGenerator } from './schema-generator';
import { ValidationRepairLoop, RepairLoopResult } from './repair-loop';
import { PromptBuilder } from './prompt-builder';
import { IntentClassifier } from './archetypes/intent-classifier';
import { ArchetypeAugmentor } from './archetypes/archetype-augmentor';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('ai-service');

export class AIGenerationService {
  private schemaGenerator = new SchemaGenerator();
  private repairLoop = new ValidationRepairLoop(this.schemaGenerator);

  /**
   * Generates a new AppDefinition from scratch based on a prompt.
   */
  public async generateAppDefinition(prompt: string): Promise<RepairLoopResult> {
    log.info({ prompt }, 'Starting AppDefinition generation');

    // Phase B2: Archetype Detection & Augmentation
    const detection = IntentClassifier.detectArchetype(prompt);
    log.info({ type: detection.type, confidence: detection.confidence }, 'Archetype detected');

    const augmentedContext = ArchetypeAugmentor.buildAugmentedContext(detection);
    
    // Build prompts
    const systemPrompt = PromptBuilder.buildSystemPrompt(augmentedContext);
    const userPrompt = `Please generate an application schema for the following request:\n"${prompt}"\nOutput RAW JSON ONLY.`;
    
    // Execute Loop
    return this.repairLoop.execute(systemPrompt, userPrompt);
  }
}

export const aiGenerationService = new AIGenerationService();
