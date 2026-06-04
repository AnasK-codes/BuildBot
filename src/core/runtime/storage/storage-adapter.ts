// ============================================================
// BuildBot — Storage Adapter Interface
// ============================================================
// Defines the contract for the storage layer. This ensures
// the CRUD handlers and OperationExecutor are fully decoupled
// from Prisma, allowing future replacement (e.g. MongoDB).
// ============================================================

import { RuntimeContext, RuntimeRecord, QueryOptions } from '@/types/runtime.types';

export interface StorageAdapter {
  create(context: RuntimeContext, data: Record<string, unknown>): Promise<RuntimeRecord>;
  
  findOne(context: RuntimeContext, id: string): Promise<RuntimeRecord | null>;
  
  findMany(context: RuntimeContext, options: QueryOptions): Promise<RuntimeRecord[]>;
  
  count(context: RuntimeContext, options: QueryOptions): Promise<number>;
  
  update(context: RuntimeContext, id: string, data: Record<string, unknown>): Promise<RuntimeRecord>;
  
  replace(context: RuntimeContext, id: string, data: Record<string, unknown>): Promise<RuntimeRecord>;
  
  delete(context: RuntimeContext, id: string): Promise<boolean>;
}
