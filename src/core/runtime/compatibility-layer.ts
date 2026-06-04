// ============================================================
// BuildBot — Data Compatibility Layer
// ============================================================
// Bridges the gap between old RuntimeRecords in the database
// and the current schema version using the MigrationPlan.
// Ensures APIs always return data conforming to the latest schema.
// ============================================================

import { EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { RuntimeRecord } from '@/types/runtime.types';

export class CompatibilityLayer {
  /**
   * Applies schema migrations on the fly (read-time coercion).
   */
  public static applyReadCompatibility(
    entity: EntityDefinition,
    record: RuntimeRecord
  ): RuntimeRecord {
    const data = { ...record.data };

    for (const field of entity.fields) {
      const val = data[field.name];

      // 1. Missing fields + defaults
      if (val === undefined && field.default !== undefined) {
        data[field.name] = field.default;
      }

      // 2. Type coercion (e.g. integer stored as string in older versions)
      if (val !== undefined && val !== null) {
        if ((field.type === 'number' || field.type === 'integer') && typeof val === 'string') {
          const num = Number(val);
          if (!isNaN(num)) data[field.name] = num;
        }
        else if (field.type === 'string' && typeof val === 'number') {
          data[field.name] = String(val);
        }
      }

      // Note: Aliasing/Renames would require us to know the *old* name at runtime.
      // In a full implementation, we'd pull the MigrationPlan history from the audit log
      // or cache it in the entity config to map old keys to new keys.
    }

    // Strip out data not present in the current schema (including deprecated/removed fields)
    const currentFields = new Set(entity.fields.map(f => f.name));
    for (const key of Object.keys(data)) {
      if (!currentFields.has(key)) {
        delete data[key];
      }
    }

    return { ...record, data };
  }
}
