// ============================================================
// BuildBot — Delete Handler
// ============================================================

import { NextRequest } from 'next/server';
import { RuntimeContext } from '@/types/runtime.types';
import { operationExecutor } from '../operation-executor';

export async function deleteHandler(req: NextRequest, context: RuntimeContext, id: string, requestId: string) {
  await operationExecutor.delete(context, id);
  return new Response(null, { status: 204 });
}
