// ============================================================
// BuildBot — Create Handler
// ============================================================

import { NextRequest } from 'next/server';
import { RuntimeContext } from '@/types/runtime.types';
import { operationExecutor } from '../operation-executor';
import { successResponse } from '@/utils/response';

export async function createHandler(req: NextRequest, context: RuntimeContext, requestId: string) {
  const body = await req.json();
  const response = await operationExecutor.create(context, body);
  
  return successResponse(response.data, 201, { requestId });
}
