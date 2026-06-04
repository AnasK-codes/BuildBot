// ============================================================
// BuildBot — Stage 1: JSON Validator
// ============================================================
// Syntactic validity of the raw JSON string.
// ============================================================

import { ValidationContext, ValidationStage } from '../types';

export class JsonValidator implements ValidationStage {
  name = 'json_validation';

  validate(context: ValidationContext): void {
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
      // Parse the JSON. If successful, update the context data
      // so the next stage operates on the parsed object.
      const parsed = JSON.parse(context.data);
      context.data = parsed;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Attempt to extract position from standard JSON parse errors
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
      
      context.haltPipeline = true; // Cannot proceed if JSON is unparseable
    }
  }
}
