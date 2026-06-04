// ============================================================
// BuildBot — AI Generation Service
// ============================================================
// Main entrypoint for converting a natural language prompt
// into a valid AppDefinition.
// ============================================================

import { ProviderFactory } from './providers/provider-factory';
import { ValidationRepairLoop, RepairLoopResult } from './repair-loop';
import { PromptBuilder } from './prompt-builder';
import { IntentClassifier } from './archetypes/intent-classifier';
import { ArchetypeAugmentor } from './archetypes/archetype-augmentor';
import { ArchetypeType } from './archetypes/archetype.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('ai-service');

export class AIGenerationService {
  private provider = ProviderFactory.getProvider();
  private repairLoop = new ValidationRepairLoop(this.provider);

  /**
   * Generates a new AppDefinition from scratch based on a prompt.
   */
  public async generateAppDefinition(prompt: string): Promise<RepairLoopResult & { archetype: ArchetypeType }> {
    log.info({ prompt }, 'Starting AppDefinition generation');

    // Phase B2: Archetype Detection & Augmentation
    const detection = IntentClassifier.detectArchetype(prompt);
    log.info({ type: detection.type, confidence: detection.confidence }, 'Archetype detected');

    const augmentedContext = ArchetypeAugmentor.buildAugmentedContext(detection);
    
    // Build prompts
    const systemPrompt = PromptBuilder.buildSystemPrompt(augmentedContext);
    const userPrompt = `Please generate an application schema for the following request:\n"${prompt}"\nOutput RAW JSON ONLY.`;
    
    const result = await this.repairLoop.execute(systemPrompt, userPrompt);
    return { ...result, archetype: detection.type };
  }
}

export const aiGenerationService = new AIGenerationService();
