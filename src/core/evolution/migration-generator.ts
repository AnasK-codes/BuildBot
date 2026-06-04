// ============================================================
// BuildBot — Migration Plan Generator
// ============================================================
// Generates logical execution plans for SchemaEvolutionReports.
// Phase 4
// ============================================================

import { SchemaChange, MigrationPlanStep } from './evolution.types';

export class MigrationGenerator {
  public static generateStep(change: SchemaChange): MigrationPlanStep {
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
      case 'FIELD_ADDED':
        return {
          entityId: change.entityId,
          fieldId: change.fieldId,
          action: 'APPLY_DEFAULT',
          description: `Compatibility layer will apply default value (if any) to older records at read-time.`,
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
