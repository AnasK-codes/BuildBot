// ============================================================
// BuildBot — Stage 3: Business Validator
// ============================================================
// Semantic correctness beyond schema structure.
// Validates cross-entity rules, duplicates, and constraints.
// ============================================================

import { ValidationContext, ValidationStage } from '../types';
import { AppDefinition, EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { isValidDefaultValue } from '@/core/metadata/field-types';

export class BusinessValidator implements ValidationStage {
  name = 'business_validation';

  validate(context: ValidationContext): void {
    const app = context.data as AppDefinition;
    
    this.checkDuplicateEntities(app, context);
    this.checkReservedEntityNames(app, context);
    
    // Check field-level rules for each entity
    app.entities.forEach(entity => {
      this.checkDuplicateFields(entity, context);
      this.checkReservedFieldNames(entity, context);
      this.checkEnumConfiguration(entity, context);
      this.checkRelationConfiguration(app, entity, context);
      this.checkDefaultValues(entity, context);
    });

    // We do NOT halt the pipeline here because we want to collect ALL business
    // validation errors across the entire app definition, and we support
    // partial acceptance (saving valid entities and skipping invalid ones).
  }

  private checkDuplicateEntities(app: AppDefinition, context: ValidationContext) {
    const seen = new Set<string>();
    app.entities.forEach(entity => {
      const lower = entity.name.toLowerCase();
      if (seen.has(lower)) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `Duplicate entity name: '${entity.name}'`,
          entity: entity.name,
        });
      }
      seen.add(lower);
    });
  }

  private checkReservedEntityNames(app: AppDefinition, context: ValidationContext) {
    const reserved = ['user', 'users', 'app', 'apps', 'appdefinition', 'entitydefinition', 'fielddefinition'];
    app.entities.forEach(entity => {
      if (reserved.includes(entity.name.toLowerCase())) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `'${entity.name}' is a system reserved entity name`,
          entity: entity.name,
        });
      }
    });
  }

  private checkDuplicateFields(entity: EntityDefinition, context: ValidationContext) {
    const seen = new Set<string>();
    entity.fields.forEach(field => {
      const lower = field.name.toLowerCase();
      if (seen.has(lower)) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `Duplicate field name: '${field.name}' in entity '${entity.name}'`,
          entity: entity.name,
          field: field.name,
        });
      }
      seen.add(lower);
    });
  }

  private checkReservedFieldNames(entity: EntityDefinition, context: ValidationContext) {
    const reserved = ['id', 'createdat', 'updatedat', 'isdeleted'];
    entity.fields.forEach(field => {
      if (reserved.includes(field.name.toLowerCase())) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `'${field.name}' is a system reserved field name and cannot be used`,
          entity: entity.name,
          field: field.name,
        });
      }
    });
  }

  private checkEnumConfiguration(entity: EntityDefinition, context: ValidationContext) {
    entity.fields.forEach(field => {
      if (field.type === 'enum' && (!field.enumValues || field.enumValues.length === 0)) {
        context.issues.push({
          stage: this.name,
          severity: 'error',
          message: `Field '${field.name}' of type 'enum' requires an 'enumValues' array`,
          entity: entity.name,
          field: field.name,
        });
      }
    });
  }

  private checkRelationConfiguration(app: AppDefinition, entity: EntityDefinition, context: ValidationContext) {
    const entityNames = new Set(app.entities.map(e => e.name.toLowerCase()));

    entity.fields.forEach(field => {
      if (field.type === 'relation') {
        if (!field.relation) {
          context.issues.push({
            stage: this.name,
            severity: 'error',
            message: `Field '${field.name}' of type 'relation' requires a 'relation' configuration block`,
            entity: entity.name,
            field: field.name,
          });
        } else {
          // entityId stores the target entity's id; get the entity name to cross-check
          const target = field.relation.entityId;
          const targetEntity = app.entities.find(e => e.id === target);
          if (!targetEntity) {
            context.issues.push({
              stage: this.name,
              severity: 'error',
              message: `Relation target entity '${target}' does not exist in this app definition`,
              entity: entity.name,
              field: field.name,
            });
          }
        }
      }
    });
  }

  private checkDefaultValues(entity: EntityDefinition, context: ValidationContext) {
    entity.fields.forEach(field => {
      if (field.default !== undefined) {
        if (!isValidDefaultValue(field.type, field.default)) {
          context.issues.push({
            stage: this.name,
            severity: 'error',
            message: `Invalid default value type for field '${field.name}' (expected matching type for '${field.type}')`,
            entity: entity.name,
            field: field.name,
          });
        }
      }
    });
  }
}
