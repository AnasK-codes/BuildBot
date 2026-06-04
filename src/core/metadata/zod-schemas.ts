// ============================================================
// BuildBot — Zod Schemas for App Definitions
// ============================================================
// These schemas exactly match the architecture specification
// and are used by the SchemaValidator (Stage 2) to validate
// the parsed JSON application definitions.
// ============================================================

import { z } from 'zod';
import { SUPPORTED_FIELD_TYPES } from './field-types';

export const FieldValidationsSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
  })
  .strict();

export const RelationshipDefinitionSchema = z
  .object({
    entityId: z.string().describe('Target entity stable ID'),
    type: z.enum(['belongsTo', 'hasMany', 'hasOne']),
  })
  .strict();

export const FieldDefinitionSchema = z
  .object({
    id: z.string().regex(/^fld_[a-zA-Z0-9_]+$/, 'Field ID must start with fld_'),
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-zA-Z0-9]*$/, 'Field name must be camelCase'),
    type: z.enum(SUPPORTED_FIELD_TYPES as [string, ...string[]]),
    required: z.boolean().default(false),
    unique: z.boolean().default(false),
    indexed: z.boolean().default(false),
    default: z.unknown().optional(),
    validations: FieldValidationsSchema.optional(),
    enumValues: z.array(z.string()).optional(),
    relation: RelationshipDefinitionSchema.optional(),
  })
  .strict();

export const EntityDefinitionSchema = z
  .object({
    id: z.string().regex(/^ent_[a-zA-Z0-9_]+$/, 'Entity ID must start with ent_'),
    name: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Entity name must be PascalCase'),
    fields: z.array(FieldDefinitionSchema).min(1).max(100),
    timestamps: z.boolean().default(true),
    softDelete: z.boolean().default(true),
  })
  .strict();

export const AppDefinitionSchema = z
  .object({
    id: z.string().optional(),
    appName: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z][a-zA-Z0-9 _-]*$/, 'App name must start with a letter'),
    description: z.string().max(500).optional(),
    entities: z.array(EntityDefinitionSchema).min(1).max(50),
  })
  .strict();
