// ============================================================
// BuildBot — App Management Service
// ============================================================
// Handles CRUD operations for AppDefinitions, enforcing user
// ownership constraints.
// ============================================================

import prisma from '@/lib/prisma';
import { metadataEngine } from './metadata-engine';
import { NotFoundError, AuthorizationError } from '@/core/errors';
import { PersistedApp } from '@/types/metadata.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('app-service');

export class AppDefinitionService {
  /**
   * Create a new app definition and process its metadata.
   */
  public async createAppDefinition(userId: string, rawJson: string): Promise<PersistedApp> {
    log.info({ userId }, 'Creating new app definition');
    
    // Process the definition first to get the appName if available
    const result = await metadataEngine.processDefinition(rawJson);
    const appName = result.appDefinition?.appName || 'Untitled App';

    // Create the empty shell
    const app = await prisma.appDefinition.create({
      data: {
        userId,
        appName,
        status: 'draft',
        rawDefinition: rawJson,
      },
    });

    // Persist the metadata
    await metadataEngine.persist(app.id, userId, result, rawJson);

    // Return the updated record
    return this.getAppDefinition(userId, app.id);
  }

  /**
   * Update an existing app definition.
   * By default, it creates a draft or applies safe changes.
   * If there are breaking changes, forcePublishBreaking must be true.
   */
  public async updateAppDefinition(
    userId: string, 
    appId: string, 
    rawJson: string, 
    forcePublishBreaking = false
  ): Promise<PersistedApp> {
    log.info({ userId, appId, forcePublishBreaking }, 'Updating app definition');
    
    // Verify ownership
    await this.assertOwnership(userId, appId);

    // Process and persist (Evolution Engine will reject if breaking & not forced)
    const result = await metadataEngine.processDefinition(rawJson);
    await metadataEngine.persist(appId, userId, result, rawJson, forcePublishBreaking);

    return this.getAppDefinition(userId, appId);
  }

  /**
   * Get an app definition, enforcing ownership.
   */
  public async getAppDefinition(userId: string, appId: string): Promise<PersistedApp> {
    const app = await prisma.appDefinition.findUnique({
      where: { id: appId },
    });

    if (!app) {
      throw new NotFoundError('AppDefinition', appId);
    }

    if (app.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this app');
    }

    return app as unknown as PersistedApp;
  }

  /**
   * List all app definitions for a user.
   */
  public async listAppDefinitions(userId: string): Promise<PersistedApp[]> {
    const apps = await prisma.appDefinition.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        appName: true,
        version: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // specifically omit rawDefinition and large validation reports for list views
      }
    });

    return apps as any;
  }

  /**
   * Delete an app definition.
   */
  public async deleteAppDefinition(userId: string, appId: string): Promise<void> {
    await this.assertOwnership(userId, appId);
    
    await prisma.appDefinition.delete({
      where: { id: appId },
    });
    
    log.info({ userId, appId }, 'App definition deleted');
  }

  private async assertOwnership(userId: string, appId: string) {
    const app = await prisma.appDefinition.findUnique({
      where: { id: appId },
      select: { userId: true },
    });

    if (!app) {
      throw new NotFoundError('AppDefinition', appId);
    }

    if (app.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this app');
    }
  }
}

export const appService = new AppDefinitionService();
