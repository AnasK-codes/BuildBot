// ============================================================
// BuildBot — Schema Impact Analyzer
// ============================================================
// Classifies SchemaChanges into SAFE, WARNING, or BREAKING.
// Determines if runtime compatibility mappings or migrations
// are required.
// ============================================================

import { SchemaChange, ChangeImpact } from './evolution.types';

export class SchemaImpactAnalyzer {
  public static analyze(change: SchemaChange): ChangeImpact {
    switch (change.type) {
      case 'ENTITY_ADDED':
        return {
          severity: 'SAFE',
          reason: 'Adding an entity does not affect existing data.',
          migrationRequired: false,
        };
        
      case 'FIELD_ADDED':
        // Note: If we had access to the new field definition here, we could
        // check if it's `required: true` with no default, which would be a WARNING/BREAKING.
        // For simplicity in this analyzer signature, we treat it as SAFE, and let 
        // the compatibility layer apply defaults.
        return {
          severity: 'SAFE',
          reason: 'Adding a field is safe; older records will fall back to defaults.',
          migrationRequired: false,
        };
        
      case 'ENTITY_RENAMED':
        return {
          severity: 'SAFE', // Safe because we use stable IDs under the hood for API/DB logic where possible
          reason: 'Entity renames do not destroy data (stable IDs used).',
          migrationRequired: false,
        };

      case 'FIELD_RENAMED':
        return {
          severity: 'WARNING',
          reason: 'Field renamed. API consumers using the old name will break unless aliased.',
          migrationRequired: true, // Requires alias logic in compatibility layer
        };

      case 'VALIDATION_CHANGED':
      case 'INDEX_CHANGED':
      case 'UNIQUE_CHANGED':
      case 'RELATION_CHANGED':
        return {
          severity: 'WARNING',
          reason: 'Constraint changes might cause future inserts to fail, but do not destroy existing data.',
          migrationRequired: false,
        };

      case 'FIELD_TYPE_CHANGED':
        return {
          severity: 'BREAKING',
          reason: 'Changing a field type breaks existing runtime data assumptions.',
          migrationRequired: true, // Requires runtime coercion strategy
        };

      case 'FIELD_REMOVED':
        return {
          severity: 'BREAKING',
          reason: 'Removing a field permanently hides existing data for that field.',
          migrationRequired: true, // Requires deprecation strategy instead of immediate drop
        };

      case 'ENTITY_REMOVED':
        return {
          severity: 'BREAKING',
          reason: 'Removing an entity drops all associated data.',
          migrationRequired: true, // Requires deprecation strategy
        };

      default:
        return {
          severity: 'WARNING',
          reason: 'Unknown change type.',
          migrationRequired: false,
        };
    }
  }
}
