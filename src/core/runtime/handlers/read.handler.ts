// ============================================================
// BuildBot — Read Handler
// ============================================================

import { NextRequest } from 'next/server';
import { RuntimeContext } from '@/types/runtime.types';
import { operationExecutor } from '../operation-executor';
import { successResponse } from '@/utils/response';

export async function readHandler(req: NextRequest, context: RuntimeContext, id: string, requestId: string) {
  const response = await operationExecutor.read(context, id);
  return successResponse(response.data, 200, { requestId });
}
