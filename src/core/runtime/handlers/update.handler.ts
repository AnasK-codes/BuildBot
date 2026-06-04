// ============================================================
// BuildBot — Update Handler (PATCH)
// ============================================================

import { NextRequest } from 'next/server';
import { RuntimeContext } from '@/types/runtime.types';
import { operationExecutor } from '../operation-executor';
import { successResponse } from '@/utils/response';

export async function updateHandler(req: NextRequest, context: RuntimeContext, id: string, requestId: string) {
  const body = await req.json();
  const response = await operationExecutor.update(context, id, body);
  return successResponse(response.data, 200, { requestId });
}
