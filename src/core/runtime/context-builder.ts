// ============================================================
// BuildBot — Runtime Context Builder
// ============================================================
// Assembles the execution context for a runtime request,
// resolving all necessary metadata and user info.
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { metadataResolver } from './metadata-resolver';
import { RuntimeContext, OperationType } from '@/types/runtime.types';
import { appService } from '@/core/metadata/app-service';

export class RuntimeContextBuilder {
  /**
   * Builds the comprehensive runtime context.
   * Also enforces app ownership at the earliest possible stage.
   */
  public async build(
    req: NextRequest,
    appId: string,
    entitySlug: string,
    operation: OperationType
  ): Promise<RuntimeContext> {
    // 1. User Context
    const authContext = authenticate(req);

    // 2. Enforce Ownership (will throw AuthorizationError if not owned)
    // Using appService here strictly for the ownership guard check
    await appService.getAppDefinition(authContext.userId, appId);

    // 3. Resolve Metadata Context
    const appDef = await metadataResolver.resolveApp(appId);
    const entityDef = await metadataResolver.resolveEntity(appId, entitySlug);

    return {
      user: authContext,
      app: appDef,
      entity: entityDef,
      operation,
      req,
    };
  }
}

export const contextBuilder = new RuntimeContextBuilder();
