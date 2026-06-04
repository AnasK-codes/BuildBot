// ============================================================
// BuildBot — AI Prompt Builder
// ============================================================
// Constructs the system and user prompts for AppDefinition
// generation, enforcing strict domain modeling constraints.
// ============================================================

import { SUPPORTED_FIELD_TYPES } from '@/core/metadata/field-types';

export class PromptBuilder {
  /**
   * Builds the system prompt for generating an AppDefinition from scratch.
   */
  public static buildSystemPrompt(): string {
    return `You are a Principal Backend Architect.
Your task is to generate a Domain Metadata Schema (AppDefinition) based on the user's prompt.
You must output ONLY valid JSON that conforms to the system's AppDefinition schema.

# Constraints and Rules:
1. Every entity must have a stable ID starting with "ent_" (e.g., "ent_customer").
2. Every field must have a stable ID starting with "fld_" (e.g., "fld_email").
3. Field names must be camelCase or PascalCase without spaces.
4. Supported field types are: ${SUPPORTED_FIELD_TYPES.join(', ')}.
5. Relationships must use the "relation" field type.
   - You MUST include a "relation" object on the field: { "entityId": "ent_target", "type": "belongsTo" | "hasMany" | "hasOne" }.
   - The "entityId" must precisely match the stable ID of the target entity.
6. Automatically add standard fields like "createdAt" or "updatedAt" IF they are semantically required by the business logic, but note that the engine handles basic timestamps automatically if the entity's "timestamps" property is true (which is the default).
7. Keep it realistic. A CRM should have reasonable fields (Name, Email, Phone, Status).

# Output Schema (JSON):
{
  "appName": "String",
  "description": "String (optional)",
  "entities": [
    {
      "id": "String (e.g., ent_user)",
      "name": "String (e.g., User)",
      "timestamps": true,
      "fields": [
        {
          "id": "String (e.g., fld_name)",
          "name": "String",
          "type": "String (from supported types)",
          "required": true|false,
          "unique": true|false,
          "validations": { "min": 0, "max": 100 } // optional
        },
        {
          "id": "fld_company_id",
          "name": "CompanyId",
          "type": "relation",
          "relation": {
            "entityId": "ent_company",
            "type": "belongsTo"
          }
        }
      ]
    }
  ]
}

DO NOT include markdown formatting (\`\`\`json) in your output. Output RAW JSON ONLY.`;
  }

  /**
   * Builds the repair prompt to feed validation errors back to the LLM.
   */
  public static buildRepairPrompt(originalJson: string, errors: any[]): string {
    return `Your previous JSON output failed validation.
Please fix the following errors and return the ENTIRE corrected JSON.

Errors:
${JSON.stringify(errors, null, 2)}

Original JSON:
${originalJson}

Output RAW JSON ONLY.`;
  }
}
