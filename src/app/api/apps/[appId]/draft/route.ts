// ============================================================
// BuildBot — /api/apps/[appId]/draft
// ============================================================

import { NextRequest } from 'next/server';
import { authenticate } from '@/core/auth';
import { AppDefinitionService } from '@/core/metadata/app-service';
import { handleError, NotFoundError } from '@/core/errors';
import { successResponse, generateRequestId } from '@/utils/response';
import { AppDefinition } from '@/types/metadata.types';

const appService = new AppDefinitionService();

export async function GET(
  req: NextRequest,
  { params }: { params: { appId: string } }
) {
  const requestId = generateRequestId();

  try {
    const user = authenticate(req);
    const { appId } = params;

    const app = await appService.getAppDefinition(user.userId, appId);

    if (!app || app.status !== 'DRAFT') {
      throw new NotFoundError(`Draft application ${appId} not found`);
    }

    let parsedDef: AppDefinition;
    try {
      parsedDef = typeof app.rawDefinition === 'string' ? JSON.parse(app.rawDefinition) : app.rawDefinition as AppDefinition;
    } catch {
      parsedDef = app.rawDefinition as AppDefinition;
    }

    // Build the summary
    const entities = parsedDef.entities || [];
    const entityNames = entities.map(e => e.name);
    
    // Extract relations
    const relationships: string[] = [];
    entities.forEach(entity => {
      entity.fields.forEach(field => {
        if (field.type === 'relation' && field.relation) {
          const targetEntity = entities.find(e => e.id === field.relation!.entityId);
          if (targetEntity) {
            relationships.push(`${entity.name} ${field.relation.type} ${targetEntity.name}`);
          }
        }
      });
    });

    const summary = {
      appId: app.id,
      appName: app.appName,
      description: parsedDef.description || 'No description provided',
      detectedArchetype: 'UNKNOWN', // Cannot retroactively infer easily without saved state
      entityCount: entities.length,
      entities: entityNames,
      relationships,
      version: app.version,
      status: app.status
    };

    return successResponse(summary, 200, { requestId });
  } catch (error) {
    return handleError(error, requestId);
  }
}
