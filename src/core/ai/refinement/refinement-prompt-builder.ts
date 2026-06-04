// ============================================================
// BuildBot — Refinement Prompt Builder
// ============================================================
// Builds the system + user prompts for AI-driven schema
// refinement, providing full current-schema context.
// ============================================================

import { SUPPORTED_FIELD_TYPES } from '@/core/metadata/field-types';
import { AppContext } from './context-aggregator';

export class RefinementPromptBuilder {
  /**
   * Builds the system prompt instructing the AI to MODIFY an existing schema.
   */
  public static buildSystemPrompt(): string {
    return `You are a Principal Backend Architect performing schema evolution.
You will receive the CURRENT AppDefinition JSON and a user instruction requesting a modification.

Your task: generate the COMPLETE UPDATED AppDefinition JSON that incorporates the requested change.

# Critical Rules:
1. PRESERVE all existing entity IDs (e.g., ent_customer). Do NOT change them.
2. PRESERVE all existing field IDs (e.g., fld_email). Do NOT change them.
3. When ADDING new entities, generate new stable IDs starting with "ent_".
4. When ADDING new fields, generate new stable IDs starting with "fld_".
5. When RENAMING, keep the same ID but change the "name" property.
6. When REMOVING, simply omit the entity or field from the output.
7. Maintain all existing relationships unless the user explicitly modifies them.
8. Supported field types: ${SUPPORTED_FIELD_TYPES.join(', ')}.
9. Relationships must use "relation" type with: { "entityId": "ent_target", "type": "belongsTo" | "hasMany" | "hasOne" }.
10. Output the ENTIRE AppDefinition, not just the changed parts.

# Output: RAW JSON ONLY. No markdown formatting.`;
  }

  /**
   * Builds the user prompt that includes current schema + instruction.
   */
  public static buildUserPrompt(context: AppContext, instruction: string): string {
    return `# Current Application Schema

${context.entityGraph}

# Current AppDefinition JSON:
${JSON.stringify(context.appDefinition, null, 2)}

# User Instruction:
"${instruction}"

Generate the COMPLETE UPDATED AppDefinition JSON that incorporates this change.
Preserve all existing stable IDs. Output RAW JSON ONLY.`;
  }
}
