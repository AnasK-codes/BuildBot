// ============================================================
// BuildBot — Field Type Registry
// ============================================================
// Centralized definitions for all supported field types.
// Used by the validation engine to verify types and defaults.
// ============================================================

import { FieldType } from '@/types/metadata.types';

export const SUPPORTED_FIELD_TYPES: FieldType[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'email',
  'url',
  'date',
  'datetime',
  'enum',
  'text',
  'json',
  'relation',
];

export function isSupportedFieldType(type: string): type is FieldType {
  return SUPPORTED_FIELD_TYPES.includes(type as FieldType);
}

/**
 * Checks if a default value matches the expected field type.
 */
export function isValidDefaultValue(type: FieldType, value: unknown): boolean {
  if (value === null || value === undefined) return true;

  switch (type) {
    case 'string':
    case 'email':
    case 'url':
    case 'text':
    case 'enum':
    case 'date':
    case 'datetime':
      return typeof value === 'string';
    case 'number':
    case 'integer':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'json':
      return typeof value === 'object';
    case 'relation':
      // Relations shouldn't have default scalar values in the schema definition
      // (except maybe a default foreign key, which would be a string/cuid)
      return typeof value === 'string';
    default:
      return false;
  }
}
