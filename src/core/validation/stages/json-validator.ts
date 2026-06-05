// ============================================================
// BuildBot — Stage 1: JSON Parse Stage
// ============================================================
// Syntactic validity of the raw JSON string from AI output.
// Reused from the original JsonValidator — same logic, new types.
// ============================================================

import { CodeValidationContext, CodeValidationStage } from '@/types/project.types';

export class JsonParseStage implements CodeValidationStage {
  name = 'json_parse';

  validate(context: CodeValidationContext): void {
    if (typeof context.data !== 'string') {
      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: 'Input must be a JSON string',
      });
      context.haltPipeline = true;
      return;
    }

    try {
      const parsed = JSON.parse(context.data);
      context.data = parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let position;
      const match = errorMessage.match(/position (\d+)/);
      if (match && match[1]) {
        position = parseInt(match[1], 10);
      }

      context.issues.push({
        stage: this.name,
        severity: 'error',
        message: `Invalid JSON syntax: ${errorMessage}`,
        details: position ? { position } : undefined,
      });
      
      context.haltPipeline = true;
    }
  }
}
