// ============================================================
// BuildBot — Schema Registry
// ============================================================
// In-memory cache of parsed AppDefinitions.
// Future compatibility with Redis can be added here.
// Used by the CRUD engine in Phase 3 for fast schema lookups.
// ============================================================

import { AppDefinition, EntityDefinition } from '@/types/metadata.types';
import prisma from '@/lib/prisma';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('schema-registry');

class SchemaRegistry {
  private cache = new Map<string, { app: AppDefinition; expiresAt: number }>();
  private readonly TTL_MS = 60 * 1000; // 60 seconds

  /**
   * Get an AppDefinition, utilizing the cache if valid.
   */
  public async getAppDefinition(appId: string, forceRefresh = false): Promise<AppDefinition | null> {
    if (!forceRefresh) {
      const cached = this.cache.get(appId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.app;
      }
    }

    log.debug({ appId }, 'Cache miss or force refresh, loading from DB');
    
    // Load from DB. Note: this requires rebuilding the AppDefinition from
    // the relational tables or using the rawDefinition if it's considered valid.
    // In our architecture, the Metadata Engine persists valid entities to the relational
    // tables, so we should reconstruct it from there to get the current truth.

    const appDef = await prisma.appDefinition.findUnique({
      where: { id: appId },
      include: {
        entities: {
          include: {
            fields: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!appDef || appDef.status === 'invalid') {
      return null;
    }

    // Reconstruct the AppDefinition object
    const app: AppDefinition = {
      appName: appDef.appName,
      entities: appDef.entities.map(e => ({
        name: e.name,
        softDelete: e.softDelete,
        timestamps: e.timestamps,
        fields: e.fields.map(f => ({
          name: f.name,
          type: f.fieldType as any,
          required: f.required,
          unique: f.isUnique,
          indexed: f.isIndexed,
          default: f.defaultValue ? JSON.parse(f.defaultValue as string) : undefined,
          validations: f.validations ? JSON.parse(f.validations as string) : undefined,
          relation: f.relationType ? {
            entity: f.relationTarget!,
            type: f.relationType as any,
          } : undefined,
        })),
      })),
    };

    this.cache.set(appId, {
      app,
      expiresAt: Date.now() + this.TTL_MS,
    });

    return app;
  }

  /**
   * Get a specific entity definition within an app.
   */
  public async getEntityDefinition(appId: string, entitySlug: string): Promise<EntityDefinition | null> {
    const app = await this.getAppDefinition(appId);
    if (!app) return null;

    const entity = app.entities.find(e => e.name.toLowerCase() === entitySlug.toLowerCase());
    return entity || null;
  }

  /**
   * Invalidate the cache for an app (called after metadata mutations).
   */
  public invalidate(appId: string) {
    log.debug({ appId }, 'Invalidating schema cache');
    this.cache.delete(appId);
  }
}

// Singleton instance
export const schemaRegistry = new SchemaRegistry();
