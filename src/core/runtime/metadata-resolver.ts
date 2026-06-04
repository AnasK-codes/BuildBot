// ============================================================
// BuildBot — Metadata Resolver
// ============================================================
// Resolves app and entity metadata from the SchemaRegistry.
// Acts as a facade to shield the runtime execution from
// registry implementation details.
// ============================================================

import { schemaRegistry } from '../metadata/schema-registry';
import { NotFoundError } from '@/core/errors';
import { AppDefinition, EntityDefinition } from '@/types/metadata.types';

export class MetadataResolver {
  /**
   * Load the AppDefinition and verify it is valid.
   */
  public async resolveApp(appId: string): Promise<AppDefinition> {
    const app = await schemaRegistry.getAppDefinition(appId);
    
    if (!app) {
      throw new NotFoundError('AppDefinition', appId);
    }
    
    return app;
  }

  /**
   * Load the EntityDefinition and verify it exists within the app.
   */
  public async resolveEntity(appId: string, entitySlug: string): Promise<EntityDefinition> {
    const entity = await schemaRegistry.getEntityDefinition(appId, entitySlug);
    
    if (!entity) {
      throw new NotFoundError(`Entity '${entitySlug}'`, `in App ${appId}`);
    }
    
    return entity;
  }
}

export const metadataResolver = new MetadataResolver();
