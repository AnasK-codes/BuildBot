// ============================================================
// BuildBot — Archetype Augmentor
// ============================================================

import { ArchetypeDetectionResult } from './archetype.types';
import { ArchetypeRegistry } from './archetype-registry';

export class ArchetypeAugmentor {
  /**
   * Injects archetype context into the prompt.
   * Returns a formatted context string if confidence > 0.7.
   */
  public static buildAugmentedContext(detection: ArchetypeDetectionResult): string | null {
    if (detection.type === 'CUSTOM' || detection.confidence <= 0.7) {
      return null;
    }

    const template = ArchetypeRegistry[detection.type];
    if (!template) {
      return null;
    }

    let context = `\n# Archetype Guidance (${template.type})\n`;
    context += `The user is requesting an application that matches the ${template.type} pattern.\n`;
    context += `Description: ${template.description}\n`;
    context += `Please strongly consider including the following structure if it aligns with the prompt:\n\n`;
    
    context += `Recommended Entities:\n`;
    template.recommendedEntities.forEach(ent => {
      context += `- ${ent}\n`;
    });

    context += `\nRecommended Relations:\n`;
    template.recommendedRelations.forEach(rel => {
      context += `- ${rel}\n`;
    });

    return context;
  }
}
