// ============================================================
// BuildBot — Draft App Service
// ============================================================

import { AppDefinitionService } from '../metadata/app-service';
import { PersistedApp, AppDefinition, EntityDefinition, RelationshipDefinition } from '@/types/metadata.types';
import { ArchetypeType } from './archetypes/archetype.types';

export interface AppSummaryResponse {
  appId: string;
  appName: string;
  description: string;
  detectedArchetype: ArchetypeType | 'UNKNOWN';
  entityCount: number;
  entities: string[];
  relationships: string[];
  version: number;
  status: string;
}

export class DraftAppService {
  private appService = new AppDefinitionService();

  /**
   * Persists a valid AppDefinition as a Draft application
   * and returns a formatted summary.
   */
  public async createDraftApp(
    userId: string, 
    appDefinitionJson: string, 
    detectedArchetype: ArchetypeType
  ): Promise<{ app: PersistedApp, summary: AppSummaryResponse }> {
    // This will persist as status: 'DRAFT' and run DB schema generation via metadataEngine
    const app = await this.appService.createAppDefinition(userId, appDefinitionJson);

    // Build the summary
    let parsedDef: AppDefinition;
    try {
      parsedDef = typeof app.rawDefinition === 'string' ? JSON.parse(app.rawDefinition) : app.rawDefinition as AppDefinition;
    } catch {
      parsedDef = JSON.parse(appDefinitionJson) as AppDefinition;
    }

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

    const summary: AppSummaryResponse = {
      appId: app.id,
      appName: app.appName,
      description: parsedDef.description || 'No description provided',
      detectedArchetype,
      entityCount: entities.length,
      entities: entityNames,
      relationships,
      version: app.version,
      status: app.status
    };

    return { app, summary };
  }
}

export const draftAppService = new DraftAppService();
