// ============================================================
// BuildBot — Dynamic Runtime Router
// ============================================================
// Translates REST HTTP requests to the metadata-driven execution
// engine based on appId and entity slug.
// ============================================================

import { NextRequest } from 'next/server';
import { contextBuilder } from '@/core/runtime';
import { handleError } from '@/core/errors';
import { generateRequestId } from '@/utils/response';

import { createHandler } from '@/core/runtime/handlers/create.handler';
import { readHandler } from '@/core/runtime/handlers/read.handler';
import { listHandler } from '@/core/runtime/handlers/list.handler';
import { updateHandler } from '@/core/runtime/handlers/update.handler';
import { replaceHandler } from '@/core/runtime/handlers/replace.handler';
import { deleteHandler } from '@/core/runtime/handlers/delete.handler';

interface Params {
  params: Promise<{ appId: string; entity: string; params?: string[] }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  try {
    const resolvedParams = await params;
    const { appId, entity, params: routeParams } = resolvedParams;
    const recordId = routeParams?.[0];

    const context = await contextBuilder.build(
      req, 
      appId, 
      entity, 
      recordId ? 'READ' : 'LIST'
    );

    if (recordId) {
      return await readHandler(req, context, recordId, requestId);
    } else {
      return await listHandler(req, context, requestId);
    }
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  try {
    const resolvedParams = await params;
    const { appId, entity, params: routeParams } = resolvedParams;

    if (routeParams && routeParams.length > 0) {
      return handleError(new Error('POST method does not accept an ID in the URL'), requestId);
    }

    const context = await contextBuilder.build(req, appId, entity, 'CREATE');
    return await createHandler(req, context, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  try {
    const resolvedParams = await params;
    const { appId, entity, params: routeParams } = resolvedParams;
    const recordId = routeParams?.[0];

    if (!recordId) {
      return handleError(new Error('PATCH method requires a record ID in the URL'), requestId);
    }

    const context = await contextBuilder.build(req, appId, entity, 'UPDATE');
    return await updateHandler(req, context, recordId, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  try {
    const resolvedParams = await params;
    const { appId, entity, params: routeParams } = resolvedParams;
    const recordId = routeParams?.[0];

    if (!recordId) {
      return handleError(new Error('PUT method requires a record ID in the URL'), requestId);
    }

    const context = await contextBuilder.build(req, appId, entity, 'REPLACE');
    return await replaceHandler(req, context, recordId, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const requestId = generateRequestId();
  try {
    const resolvedParams = await params;
    const { appId, entity, params: routeParams } = resolvedParams;
    const recordId = routeParams?.[0];

    if (!recordId) {
      return handleError(new Error('DELETE method requires a record ID in the URL'), requestId);
    }

    const context = await contextBuilder.build(req, appId, entity, 'DELETE');
    return await deleteHandler(req, context, recordId, requestId);
  } catch (error) {
    return handleError(error, requestId);
  }
}
