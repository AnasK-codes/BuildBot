// ============================================================
// BuildBot — Evolution Report Generator
// ============================================================
// Orchestrates the Differ and Analyzer to produce a final
// SchemaEvolutionReport and MigrationPlan.
// ============================================================

import { AppDefinition } from '@/types/metadata.types';
import { SchemaDiffer } from './schema-differ';
import { SchemaImpactAnalyzer } from './impact-analyzer';
import { SchemaEvolutionReport, MigrationPlanStep, ChangeSeverity } from './evolution.types';

export class EvolutionReportGenerator {
  public static generate(oldApp: AppDefinition, newApp: AppDefinition): SchemaEvolutionReport {
    const changes = SchemaDiffer.diff(oldApp, newApp);
    
    const safeChanges = [];
    const warningChanges = [];
    const breakingChanges = [];
    const migrationRequirements: MigrationPlanStep[] = [];
    
    let highestSeverity: ChangeSeverity = 'SAFE';

    for (const change of changes) {
      const impact = SchemaImpactAnalyzer.analyze(change);
      
      // Update highest severity
      if (impact.severity === 'BREAKING') highestSeverity = 'BREAKING';
      if (impact.severity === 'WARNING' && highestSeverity !== 'BREAKING') highestSeverity = 'WARNING';

      // Categorize
      if (impact.severity === 'SAFE') safeChanges.push(change);
      if (impact.severity === 'WARNING') warningChanges.push(change);
      if (impact.severity === 'BREAKING') breakingChanges.push(change);

      // Generate migration step if required
      if (impact.migrationRequired) {
        migrationRequirements.push(this.generateMigrationStep(change));
      }
    }

    // Task 11: Relation Safety Check
    // If an entity is removed, ensure no remaining entities have active relations to it.
    const removedEntityIds = new Set(changes.filter(c => c.type === 'ENTITY_REMOVED').map(c => c.entityId));
    if (removedEntityIds.size > 0) {
      newApp.entities.forEach(entity => {
        entity.fields.forEach(field => {
          if (field.type === 'relation' && field.relation && removedEntityIds.has(field.relation.entityId)) {
            // A remaining entity is trying to reference a removed entity
            const safetyChange: SchemaChange = {
              type: 'RELATION_CHANGED',
              entityId: entity.id,
              entityName: entity.name,
              fieldId: field.id,
              fieldName: field.name,
              details: `CRITICAL: Field references an entity that was removed in this update.`,
            };
            breakingChanges.push(safetyChange);
            highestSeverity = 'BREAKING';
          }
        });
      });
    }

    return {
      safeChanges,
      warningChanges,
      breakingChanges,
      summary: {
        totalChanges: changes.length,
        highestSeverity,
      },
      migrationRequirements,
    };
  }

  private static generateMigrationStep(change: any): MigrationPlanStep {
    switch (change.type) {
      case 'FIELD_REMOVED':
      case 'ENTITY_REMOVED':
        return {
          entityId: change.entityId,
          fieldId: change.fieldId,
          action: 'MARK_DEPRECATED',
          description: `Will mark ${change.fieldName || change.entityName} as deprecated rather than dropping it immediately.`,
        };
      case 'FIELD_RENAMED':
        return {
          entityId: change.entityId,
          fieldId: change.fieldId,
          action: 'ALIAS_FIELD',
          description: `Compatibility layer will map old name '${change.oldValue}' to new name '${change.newValue}'.`,
        };
      case 'FIELD_TYPE_CHANGED':
        return {
          entityId: change.entityId,
          fieldId: change.fieldId,
          action: 'COERCE_TYPE',
          description: `Compatibility layer will attempt to coerce existing data from ${change.oldValue} to ${change.newValue}.`,
        };
      default:
        return {
          entityId: change.entityId,
          fieldId: change.fieldId,
          action: 'NO_ACTION',
          description: 'Requires manual intervention or no automated strategy available.',
        };
    }
  }
}
