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
  private cache = new Map<string, { app: AppDefinition; version: number; expiresAt: number }>();
  private readonly TTL_MS = 60 * 1000; // 60 seconds

  /**
   * Get an AppDefinition. Supports looking up specific versions or the latest ACTIVE/DRAFT.
   */
  public async getAppDefinition(appId: string, forceRefresh = false, version?: number): Promise<AppDefinition | null> {
    const cacheKey = version ? `${appId}_v${version}` : appId;

    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.app;
      }
    }

    log.debug({ appId, version }, 'Cache miss or force refresh, loading from DB');
    
    // Load from DB. Find by ID, and if a specific version isn't requested, we just take what's there.
    const appDef = await prisma.appDefinition.findUnique({
      where: { id: appId },
      include: {
        entities: {
          where: { deprecatedAt: null }, // Do not load deprecated entities into active runtime cache
          include: {
            fields: {
              where: { deprecatedAt: null }, // Do not load deprecated fields
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!appDef || appDef.status === 'INVALID') {
      return null;
    }

    // If version is specified and mismatch, this logic would ideally query an audit log or snapshot table
    // For now, since we only keep the active relational state in these tables, we return it if it matches
    // or if no version was asked for.
    if (version !== undefined && appDef.version !== version) {
      log.warn(`Requested version ${version} for app ${appId}, but DB has ${appDef.version}`);
      // In a full implementation, load from snapshot history here.
    }

    // Reconstruct the AppDefinition object (with stable IDs)
    const app: AppDefinition = {
      id: appDef.id,
      appName: appDef.appName,
      entities: appDef.entities.map(e => ({
        id: e.stableId,
        name: e.name,
        softDelete: e.softDelete,
        timestamps: e.timestamps,
        fields: e.fields.map(f => ({
          id: f.stableId,
          name: f.name,
          type: f.fieldType as any,
          required: f.required,
          unique: f.isUnique,
          indexed: f.isIndexed,
          default: f.defaultValue ? JSON.parse(f.defaultValue as string) : undefined,
          validations: f.validations ? JSON.parse(f.validations as string) : undefined,
          relation: f.relationType ? {
            entityId: f.relationTarget!,
            type: f.relationType as any,
          } : undefined,
        })),
      })),
    };

    this.cache.set(cacheKey, {
      app,
      version: appDef.version,
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
  public invalidate(appId: string, version?: number) {
    log.debug({ appId, version }, 'Invalidating schema cache');
    this.cache.delete(appId); // invalidate latest
    if (version) {
      this.cache.delete(`${appId}_v${version}`);
    }
  }
}

// Singleton instance
export const schemaRegistry = new SchemaRegistry();
