// ============================================================
// BuildBot — Stage 4: Runtime Validator
// ============================================================
// Validates arbitrary JSON payloads against the loaded
// EntityDefinition at request time (POST/PUT/PATCH).
// ============================================================

import { EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { ValidationError as CustomValidationError } from '@/core/errors';
import { OperationType } from '@/types/runtime.types';

export class RuntimeValidator {
  /**
   * Validate a payload against an entity schema.
   * Throws ValidationError on failure.
   */
  public validatePayload(
    entity: EntityDefinition,
    payload: Record<string, unknown>,
    operation: OperationType
  ): Record<string, unknown> {
    const validatedData: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Check for unknown fields (stripped securely, but logged as warnings)
    const knownFields = new Set(entity.fields.map(f => f.name));
    for (const key of Object.keys(payload)) {
      if (!knownFields.has(key)) {
        warnings.push(`Unknown field '${key}' was ignored.`);
      }
    }

    const isPatch = operation === 'UPDATE';

    for (const field of entity.fields) {
      const value = payload[field.name];

      // Handle missing values
      if (value === undefined || value === null) {
        if (field.required && !isPatch) {
          errors[field.name] = 'Field is required';
        } else if (value === null && field.required) {
          errors[field.name] = 'Field cannot be null';
        }
        continue; // Skip further validation if undefined/null (and not required/patch)
      }

      // Type and constraint validation
      const fieldError = this.validateField(field, value);
      if (fieldError) {
        errors[field.name] = fieldError;
      } else {
        // Only include if valid to strip unknowns and prevent prototype pollution
        validatedData[field.name] = value;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new CustomValidationError('Request validation failed', { errors, warnings });
    }

    return validatedData;
  }

  private validateField(field: FieldDefinition, value: unknown): string | null {
    switch (field.type) {
      case 'string':
      case 'text':
        if (typeof value !== 'string') return 'Expected a string';
        if (field.validations?.minLength !== undefined && value.length < field.validations.minLength) {
          return `Minimum length is ${field.validations.minLength}`;
        }
        if (field.validations?.maxLength !== undefined && value.length > field.validations.maxLength) {
          return `Maximum length is ${field.validations.maxLength}`;
        }
        if (field.validations?.pattern && !new RegExp(field.validations.pattern).test(value)) {
          return 'Value does not match required pattern';
        }
        break;

      case 'number':
        if (typeof value !== 'number') return 'Expected a number';
        if (field.validations?.min !== undefined && value < field.validations.min) {
          return `Minimum value is ${field.validations.min}`;
        }
        if (field.validations?.max !== undefined && value > field.validations.max) {
          return `Maximum value is ${field.validations.max}`;
        }
        break;

      case 'integer':
        if (typeof value !== 'number' || !Number.isInteger(value)) return 'Expected an integer';
        if (field.validations?.min !== undefined && value < field.validations.min) {
          return `Minimum value is ${field.validations.min}`;
        }
        if (field.validations?.max !== undefined && value > field.validations.max) {
          return `Maximum value is ${field.validations.max}`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') return 'Expected a boolean';
        break;

      case 'email':
        if (typeof value !== 'string') return 'Expected a string';
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) return 'Invalid email format';
        break;

      case 'url':
        if (typeof value !== 'string') return 'Expected a string';
        try {
          new URL(value);
        } catch (_) {
          return 'Invalid URL format';
        }
        break;

      case 'date':
      case 'datetime':
        if (typeof value !== 'string') return 'Expected an ISO date string';
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Invalid date format';
        break;

      case 'enum':
        if (typeof value !== 'string') return 'Expected a string';
        if (!field.enumValues?.includes(value)) {
          return `Must be one of: ${field.enumValues?.join(', ')}`;
        }
        break;

      case 'json':
        if (typeof value !== 'object' || Array.isArray(value)) return 'Expected a JSON object';
        break;

      case 'relation':
        // A relation field expects an ID (string)
        if (typeof value !== 'string') return 'Expected a related record ID (string)';
        break;

      default:
        return `Unknown field type: ${field.type}`;
    }

    return null;
  }
}

export const runtimeValidator = new RuntimeValidator();
