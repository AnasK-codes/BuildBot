// ============================================================
// BuildBot — List Handler
// ============================================================

import { NextRequest } from 'next/server';
import { RuntimeContext, QueryOptions, FilterCondition } from '@/types/runtime.types';
import { operationExecutor } from '../operation-executor';
import { successResponse } from '@/utils/response';

export async function listHandler(req: NextRequest, context: RuntimeContext, requestId: string) {
  // Parse query parameters into QueryOptions
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const cursor = url.searchParams.get('cursor') || undefined;
  
  // Basic filter parsing (field=value)
  const filters: FilterCondition[] = [];
  url.searchParams.forEach((value, key) => {
    if (!['limit', 'cursor', 'sort', 'fields'].includes(key)) {
      filters.push({
        field: key,
        operator: 'equals',
        value,
      });
    }
  });

  const query: QueryOptions = {
    filters,
    pagination: { limit, cursor },
    // sort and fields projection would be parsed similarly here
  };

  const response = await operationExecutor.list(context, query);
  
  return successResponse(response.data, 200, { 
    requestId, 
    ...response.meta 
  });
}
