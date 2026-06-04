// ============================================================
// BuildBot — Operation Executor
// ============================================================
// The core execution engine. Connects validation and storage.
// Thin CRUD handlers pass requests to this executor.
// ============================================================

import { RuntimeContext, QueryOptions, RuntimeResponse, RuntimeRecord } from '@/types/runtime.types';
import { RuntimeValidator } from '../validation/stages/runtime-validator';
import { StorageAdapter } from './storage/storage-adapter';

const runtimeValidator = new RuntimeValidator();
import { prismaStorageAdapter } from './storage/prisma-adapter';
import { NotFoundError, ValidationError } from '@/core/errors';
import { CompatibilityLayer } from './compatibility-layer';

export class OperationExecutor {
  constructor(private storage: StorageAdapter = prismaStorageAdapter) {}

  public async create(context: RuntimeContext, body: Record<string, unknown>): Promise<RuntimeResponse<RuntimeRecord>> {
    // 1. Validate payload
    const validatedData = runtimeValidator.validatePayload(context.entity, body, 'CREATE');

    // 2. Execute Relation validation
    await this.validateRelations(context, validatedData);

    // 3. Store
    const record = await this.storage.create(context, validatedData);

    return { data: record };
  }

  public async read(context: RuntimeContext, id: string): Promise<RuntimeResponse<RuntimeRecord>> {
    const record = await this.storage.findOne(context, id);
    
    if (!record) {
      throw new NotFoundError(context.entity.name, id);
    }
    
    const compatibleRecord = CompatibilityLayer.applyReadCompatibility(context.entity, record);
    return { data: compatibleRecord };
  }

  public async list(context: RuntimeContext, query: QueryOptions): Promise<RuntimeResponse<RuntimeRecord[]>> {
    const limit = query.pagination.limit || 20;
    
    // Find many asks for limit + 1 internally via QueryBuilder
    const records = await this.storage.findMany(context, query);
    
    const hasMore = records.length > limit;
    if (hasMore) {
      records.pop(); // Remove the extra record
    }

    const nextCursor = hasMore ? records[records.length - 1].id : undefined;

    const compatibleRecords = records.map(r => CompatibilityLayer.applyReadCompatibility(context.entity, r));

    return {
      data: compatibleRecords,
      meta: {
        pagination: {
          hasMore,
          cursor: nextCursor,
        }
      }
    };
  }

  public async update(context: RuntimeContext, id: string, body: Record<string, unknown>): Promise<RuntimeResponse<RuntimeRecord>> {
    // 1. Validate partial payload
    const validatedData = runtimeValidator.validatePayload(context.entity, body, 'UPDATE');

    // 2. Validate relations
    await this.validateRelations(context, validatedData);

    // 3. Update
    try {
      const record = await this.storage.update(context, id, validatedData);
      return { data: record };
    } catch (error) {
      throw new NotFoundError(context.entity.name, id);
    }
  }

  public async replace(context: RuntimeContext, id: string, body: Record<string, unknown>): Promise<RuntimeResponse<RuntimeRecord>> {
    // 1. Validate full payload
    const validatedData = runtimeValidator.validatePayload(context.entity, body, 'REPLACE');

    // 2. Validate relations
    await this.validateRelations(context, validatedData);

    // 3. Replace
    try {
      const record = await this.storage.replace(context, id, validatedData);
      return { data: record };
    } catch (error) {
      throw new NotFoundError(context.entity.name, id);
    }
  }

  public async delete(context: RuntimeContext, id: string): Promise<void> {
    const success = await this.storage.delete(context, id);
    if (!success) {
      throw new NotFoundError(context.entity.name, id);
    }
  }

  /**
   * Validates that foreign key IDs exist in related entities.
   */
  private async validateRelations(context: RuntimeContext, data: Record<string, unknown>) {
    for (const field of context.entity.fields) {
      if (field.type === 'relation' && field.relation && data[field.name]) {
        const targetId = data[field.name] as string;
        const targetEntityStableId = field.relation.entityId;
        
        // Find the target record
        // We create a temporary context to fetch the related entity
        const targetContext: RuntimeContext = {
          ...context,
          entity: { ...context.entity, id: targetEntityStableId, name: targetEntityStableId } // mock for validation
        };

        const targetRecord = await this.storage.findOne(targetContext, targetId);
        
        if (!targetRecord) {
          throw new ValidationError('Relation validation failed', {
            errors: {
              [field.name]: `Related record '${targetId}' in entity '${field.relation.entityId}' does not exist.`
            }
          });
        }
      }
    }
  }
}

export const operationExecutor = new OperationExecutor();
