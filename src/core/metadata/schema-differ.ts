// ============================================================
// BuildBot — Schema Differ
// ============================================================
// Detects changes between two versions of an AppDefinition.
// Lays the foundation for schema evolution (Phase 4).
// ============================================================

import { AppDefinition, EntityDefinition, FieldDefinition } from '@/types/metadata.types';

export type ChangeType = 'added' | 'removed' | 'modified';

export interface SchemaChange {
  type: ChangeType;
  entityName: string;
  fieldName?: string;
  details: string;
}

export class SchemaDiffer {
  /**
   * Compares the old definition with the new definition and returns a list
   * of logical schema changes.
   */
  public static diff(oldApp: AppDefinition, newApp: AppDefinition): SchemaChange[] {
    const changes: SchemaChange[] = [];

    const oldEntities = new Map(oldApp.entities.map(e => [e.name, e]));
    const newEntities = new Map(newApp.entities.map(e => [e.name, e]));

    // Check for removed and modified entities
    for (const [name, oldEntity] of oldEntities.entries()) {
      const newEntity = newEntities.get(name);
      
      if (!newEntity) {
        changes.push({
          type: 'removed',
          entityName: name,
          details: `Entity '${name}' was removed.`,
        });
      } else {
        // Compare fields if entity still exists
        this.diffFields(name, oldEntity, newEntity, changes);
      }
    }

    // Check for added entities
    for (const [name] of newEntities.entries()) {
      if (!oldEntities.has(name)) {
        changes.push({
          type: 'added',
          entityName: name,
          details: `Entity '${name}' was added.`,
        });
      }
    }

    return changes;
  }

  private static diffFields(
    entityName: string, 
    oldEntity: EntityDefinition, 
    newEntity: EntityDefinition, 
    changes: SchemaChange[]
  ) {
    const oldFields = new Map(oldEntity.fields.map(f => [f.name, f]));
    const newFields = new Map(newEntity.fields.map(f => [f.name, f]));

    // Check for removed and modified fields
    for (const [name, oldField] of oldFields.entries()) {
      const newField = newFields.get(name);
      
      if (!newField) {
        changes.push({
          type: 'removed',
          entityName,
          fieldName: name,
          details: `Field '${name}' was removed from entity '${entityName}'.`,
        });
      } else if (oldField.type !== newField.type) {
        changes.push({
          type: 'modified',
          entityName,
          fieldName: name,
          details: `Field '${name}' type changed from '${oldField.type}' to '${newField.type}'.`,
        });
      }
    }

    // Check for added fields
    for (const [name] of newFields.entries()) {
      if (!oldFields.has(name)) {
        changes.push({
          type: 'added',
          entityName,
          fieldName: name,
          details: `Field '${name}' was added to entity '${entityName}'.`,
        });
      }
    }
  }
}
