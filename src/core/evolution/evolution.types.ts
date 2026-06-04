// ============================================================
// BuildBot — Evolution Domain Models
// ============================================================
// Strongly typed models for the schema evolution engine.
// Phase 4
// ============================================================

export type ChangeSeverity = 'SAFE' | 'WARNING' | 'BREAKING';

export type ChangeType =
  | 'ENTITY_ADDED'
  | 'ENTITY_REMOVED'
  | 'ENTITY_RENAMED'
  | 'FIELD_ADDED'
  | 'FIELD_REMOVED'
  | 'FIELD_RENAMED'
  | 'FIELD_TYPE_CHANGED'
  | 'VALIDATION_CHANGED'
  | 'RELATION_CHANGED'
  | 'INDEX_CHANGED'
  | 'UNIQUE_CHANGED';

export interface SchemaChange {
  type: ChangeType;
  entityId: string;
  entityName: string;
  fieldId?: string;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  details: string;
}

export interface SchemaChangeSet {
  changes: SchemaChange[];
}

export interface ChangeImpact {
  severity: ChangeSeverity;
  reason: string;
  migrationRequired: boolean;
}

export interface MigrationPlanStep {
  entityId: string;
  fieldId?: string;
  action: 'NO_ACTION' | 'MARK_DEPRECATED' | 'ALIAS_FIELD' | 'COERCE_TYPE' | 'APPLY_DEFAULT';
  description: string;
}

export interface SchemaEvolutionReport {
  safeChanges: SchemaChange[];
  warningChanges: SchemaChange[];
  breakingChanges: SchemaChange[];
  summary: {
    totalChanges: number;
    highestSeverity: ChangeSeverity;
  };
  migrationRequirements: MigrationPlanStep[];
}
