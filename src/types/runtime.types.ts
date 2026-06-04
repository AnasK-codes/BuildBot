// ============================================================
// BuildBot — Runtime Types
// ============================================================
// Strongly typed domain models for the dynamic execution layer.
// Ensures loose coupling between handlers and storage.
// ============================================================

import { AppDefinition, EntityDefinition } from './metadata.types';
import { AuthContext } from './auth.types';

export type OperationType = 'LIST' | 'READ' | 'CREATE' | 'UPDATE' | 'REPLACE' | 'DELETE';

export interface RuntimeContext {
  user: AuthContext;
  app: AppDefinition;
  entity: EntityDefinition;
  operation: OperationType;
  req: Request;
}

export interface RuntimeRecord {
  id: string;
  appId: string;
  userId: string;
  entitySlug: string;
  data: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: unknown;
}

export interface SortCondition {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  limit: number;
  cursor?: string;
}

export interface QueryOptions {
  filters: FilterCondition[];
  sort?: SortCondition;
  pagination: PaginationOptions;
  fields?: string[]; // projection
}

export interface RuntimeRequest {
  context: RuntimeContext;
  body?: Record<string, unknown>;
  query?: QueryOptions;
  recordId?: string;
}

export interface RuntimeResponse<T = unknown> {
  data: T;
  meta?: {
    pagination?: {
      cursor?: string;
      hasMore: boolean;
    };
  };
}
