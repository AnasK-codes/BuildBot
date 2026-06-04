// ============================================================
// BuildBot — Stage 2: Schema Validator
// ============================================================
// Structural conformance against the AppDefinition schema.
// ============================================================

import { ValidationContext, ValidationStage } from '../types';
import { AppDefinitionSchema } from '@/core/metadata/zod-schemas';

export class SchemaValidator implements ValidationStage {
  name = 'schema_validation';

  validate(context: ValidationContext): void {
    const result = AppDefinitionSchema.safeParse(context.data);

    if (!result.success) {
      result.error.issues.forEach(issue => {
        // Extract entity and field names from the path if possible
        // Paths look like: ['entities', 0, 'fields', 1, 'type']
        let entityName;
        let fieldName;

        const path = issue.path;
        
        try {
          if (path[0] === 'entities' && typeof path[1] === 'number') {
            const rawData = context.data as any;
            const entity = rawData.entities[path[1]];
            if (entity && entity.name) {
              entityName = entity.name;
              
              if (path[2] === 'fields' && typeof path[3] === 'number') {
                const field = entity.fields[path[3]];
                if (field && field.name) {
                  fieldName = field.name;
                }
              }
            }
          }
        } catch (e) {
          // Ignore path extraction errors
        }

        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: issue.message,
          path: issue.path.join('.'),
          entity: entityName,
          field: fieldName,
          details: { code: issue.code },
        });
      });

      // Halt if structural schema is invalid, because Stage 3
      // expects a strictly formed AppDefinition object.
      context.haltPipeline = true;
    } else {
      // Data is valid, replace context data with the parsed/coerced Zod output
      context.data = result.data;
    }
  }
}
