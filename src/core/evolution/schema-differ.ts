// ============================================================
// BuildBot — Schema Differ
// ============================================================
// Phase 4 - Uses Stable IDs to detect renames, additions,
// removals, and modifications accurately.
// ============================================================

import { AppDefinition, EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { SchemaChange } from './evolution.types';

export class SchemaDiffer {
  /**
   * Compares the old definition with the new definition and returns a list
   * of logical schema changes based on Stable IDs.
   */
  public static diff(oldApp: AppDefinition, newApp: AppDefinition): SchemaChange[] {
    const changes: SchemaChange[] = [];

    // Map by stable ID
    const oldEntities = new Map(oldApp.entities.map(e => [e.id, e]));
    const newEntities = new Map(newApp.entities.map(e => [e.id, e]));

    // Check for removed, renamed, and modified entities
    for (const [id, oldEntity] of oldEntities.entries()) {
      const newEntity = newEntities.get(id);
      
      if (!newEntity) {
        changes.push({
          type: 'ENTITY_REMOVED',
          entityId: id,
          entityName: oldEntity.name,
          details: `Entity '${oldEntity.name}' was removed.`,
        });
      } else {
        if (oldEntity.name !== newEntity.name) {
          changes.push({
            type: 'ENTITY_RENAMED',
            entityId: id,
            entityName: newEntity.name, // Use new name for context
            oldValue: oldEntity.name,
            newValue: newEntity.name,
            details: `Entity renamed from '${oldEntity.name}' to '${newEntity.name}'.`,
          });
        }
        
        // Check fields
        this.diffFields(oldEntity, newEntity, changes);
      }
    }

    // Check for added entities
    for (const [id, newEntity] of newEntities.entries()) {
      if (!oldEntities.has(id)) {
        changes.push({
          type: 'ENTITY_ADDED',
          entityId: id,
          entityName: newEntity.name,
          details: `Entity '${newEntity.name}' was added.`,
        });
      }
    }

    return changes;
  }

  private static diffFields(
    oldEntity: EntityDefinition, 
    newEntity: EntityDefinition, 
    changes: SchemaChange[]
  ) {
    const oldFields = new Map(oldEntity.fields.map(f => [f.id, f]));
    const newFields = new Map(newEntity.fields.map(f => [f.id, f]));

    // Check for removed, renamed, and modified fields
    for (const [id, oldField] of oldFields.entries()) {
      const newField = newFields.get(id);
      
      if (!newField) {
        changes.push({
          type: 'FIELD_REMOVED',
          entityId: oldEntity.id,
          entityName: newEntity.name, // Context
          fieldId: id,
          fieldName: oldField.name,
          details: `Field '${oldField.name}' was removed from entity '${newEntity.name}'.`,
        });
      } else {
        if (oldField.name !== newField.name) {
          changes.push({
            type: 'FIELD_RENAMED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            oldValue: oldField.name,
            newValue: newField.name,
            details: `Field renamed from '${oldField.name}' to '${newField.name}'.`,
          });
        }

        if (oldField.type !== newField.type) {
          changes.push({
            type: 'FIELD_TYPE_CHANGED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            oldValue: oldField.type,
            newValue: newField.type,
            details: `Field '${newField.name}' type changed from '${oldField.type}' to '${newField.type}'.`,
          });
        }

        // Simplistic deep equal checks for JSON configurations
        if (JSON.stringify(oldField.validations || {}) !== JSON.stringify(newField.validations || {})) {
          changes.push({
            type: 'VALIDATION_CHANGED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            details: `Validations for field '${newField.name}' were modified.`,
          });
        }

        if (JSON.stringify(oldField.relation || {}) !== JSON.stringify(newField.relation || {})) {
          changes.push({
            type: 'RELATION_CHANGED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            details: `Relation config for field '${newField.name}' was modified.`,
          });
        }
        
        if (oldField.unique !== newField.unique) {
          changes.push({
            type: 'UNIQUE_CHANGED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            oldValue: oldField.unique,
            newValue: newField.unique,
            details: `Unique constraint on '${newField.name}' changed to ${newField.unique}.`,
          });
        }
        
        if (oldField.indexed !== newField.indexed) {
          changes.push({
            type: 'INDEX_CHANGED',
            entityId: newEntity.id,
            entityName: newEntity.name,
            fieldId: id,
            fieldName: newField.name,
            oldValue: oldField.indexed,
            newValue: newField.indexed,
            details: `Index on '${newField.name}' changed to ${newField.indexed}.`,
          });
        }
      }
    }

    // Check for added fields
    for (const [id, newField] of newFields.entries()) {
      if (!oldFields.has(id)) {
        changes.push({
          type: 'FIELD_ADDED',
          entityId: newEntity.id,
          entityName: newEntity.name,
          fieldId: id,
          fieldName: newField.name,
          details: `Field '${newField.name}' was added to entity '${newEntity.name}'.`,
        });
      }
    }
  }
}
