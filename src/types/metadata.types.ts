// ============================================================
// BuildBot — Metadata Types
// ============================================================
// Strictly typed domain models for metadata representing apps,
// entities, fields, and validation reports.
// ============================================================

// --- Field Types ---

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'enum'
  | 'text'
  | 'json'
  | 'relation';

export type RelationType = 'belongsTo' | 'hasMany' | 'hasOne';

export interface RelationshipDefinition {
  entity: string; // Target entity name (PascalCase)
  type: RelationType;
}

export interface FieldValidations {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: unknown;
  validations?: FieldValidations;
  enumValues?: string[];
  relation?: RelationshipDefinition;
}

// --- Entity & App Types ---

export interface EntityDefinition {
  name: string;
  fields: FieldDefinition[];
  timestamps?: boolean;
  softDelete?: boolean;
}

export interface AppDefinition {
  appName: string;
  description?: string;
  entities: EntityDefinition[];
}

// --- Validation Types ---

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  stage: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  entity?: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError extends ValidationIssue {
  severity: 'error';
}

export interface ValidationWarning extends ValidationIssue {
  severity: 'warning';
}

export interface ValidationReport {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalEntitiesProcessed: number;
    validEntities: number;
    invalidEntities: number;
    stageReached: string;
  };
}

export interface MetadataValidationResult {
  report: ValidationReport;
  appDefinition: AppDefinition | null;
  // If partial acceptance is enabled, validEntities will contain the subset
  // of entities that passed all checks.
  validEntities: EntityDefinition[];
}

// --- Internal Engine Types ---

export type AppStatus = 'active' | 'draft' | 'invalid';

export interface PersistedApp {
  id: string;
  userId: string;
  appName: string;
  version: number;
  status: AppStatus;
  rawDefinition: unknown;
  validationReport: ValidationReport | null;
  createdAt: Date;
  updatedAt: Date;
}
