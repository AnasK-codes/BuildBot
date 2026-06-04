// ============================================================
// BuildBot — Validation Engine Orchestrator
// ============================================================
// Executes the multi-stage validation pipeline on app definitions.
// Never throws exceptions; always returns a structured ValidationReport.
// ============================================================

import { ValidationContext, ValidationStage } from './types';
import { ValidationReport, ValidationError, ValidationWarning } from '@/types/metadata.types';
import { JsonValidator } from './stages/json-validator';
import { SchemaValidator } from './stages/schema-validator';
import { BusinessValidator } from './stages/business-validator';

export class ValidationEngine {
  private stages: ValidationStage[] = [
    new JsonValidator(),
    new SchemaValidator(),
    new BusinessValidator(),
    // RuntimeValidator is not part of this pipeline as it runs on CRUD data
  ];

  /**
   * Run the validation pipeline on a raw JSON string.
   */
  public async validateAppDefinition(rawJson: string): Promise<ValidationReport> {
    const context: ValidationContext = {
      data: rawJson,
      issues: [],
      haltPipeline: false,
    };

    let stageReached = 'init';

    for (const stage of this.stages) {
      stageReached = stage.name;
      try {
        await stage.validate(context);
      } catch (error) {
        // Fallback catch for unexpected errors within a stage
        context.issues.push({
          stage: stage.name,
          severity: 'error',
          message: `Unexpected error during ${stage.name}: ${error instanceof Error ? error.message : String(error)}`,
        });
        context.haltPipeline = true;
      }

      if (context.haltPipeline) {
        break;
      }
    }

    return this.buildReport(context, stageReached);
  }

  private buildReport(context: ValidationContext, stageReached: string): ValidationReport {
    const errors = context.issues.filter((i): i is ValidationError => i.severity === 'error');
    const warnings = context.issues.filter((i): i is ValidationWarning => i.severity === 'warning');

    // Calculate valid/invalid entities if we passed Stage 2 (SchemaValidation)
    let totalEntitiesProcessed = 0;
    let invalidEntities = 0;

    if (
      !context.haltPipeline || 
      (context.haltPipeline && stageReached === 'business_validation')
    ) {
      const appDef = context.data as any;
      if (appDef && Array.isArray(appDef.entities)) {
        totalEntitiesProcessed = appDef.entities.length;
        
        // Count unique entities with errors
        const entitiesWithErrors = new Set(
          errors.filter(e => e.entity).map(e => e.entity)
        );
        invalidEntities = entitiesWithErrors.size;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalEntitiesProcessed,
        validEntities: totalEntitiesProcessed - invalidEntities,
        invalidEntities,
        stageReached,
      },
    };
  }
}
