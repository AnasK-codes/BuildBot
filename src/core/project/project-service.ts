// ============================================================
// BuildBot — Project Service
// ============================================================
// CRUD operations for Projects with ownership enforcement.
// Refactored from the original AppDefinitionService — same
// ownership assertion pattern, new domain models.
// ============================================================

import { getPrisma } from '@/lib/prisma';
import { NotFoundError, AuthorizationError } from '@/core/errors';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('project-service');

export class ProjectService {
  /**
   * Create a new project record in GENERATING state.
   */
  public async createProject(userId: string, title: string, prompt: string) {
    log.info({ userId, title }, 'Creating new project');

    const project = await getPrisma().project.create({
      data: {
        userId,
        title,
        prompt,
        status: 'GENERATING',
        currentVersion: 0, // Will be set to 1 when first version completes
      },
    });

    return project;
  }

  /**
   * Mark project as READY with version 1.
   */
  public async markReady(projectId: string, version = 1) {
    return getPrisma().project.update({
      where: { id: projectId },
      data: { status: 'READY', currentVersion: version },
    });
  }

  /**
   * Mark project as ERROR.
   */
  public async markError(projectId: string) {
    return getPrisma().project.update({
      where: { id: projectId },
      data: { status: 'ERROR' },
    });
  }

  /**
   * Get a project with its current version's files. Enforces ownership.
   */
  public async getProjectWithFiles(userId: string, projectId: string) {
    const project = await getPrisma().project.findUnique({
      where: { id: projectId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: { files: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    if (project.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this project');
    }

    return project;
  }

  /**
   * Get a project by ID, enforcing ownership.
   */
  public async getProject(userId: string, projectId: string) {
    const project = await getPrisma().project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    if (project.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this project');
    }

    return project;
  }

  /**
   * List all projects for a user, ordered by most recently updated.
   */
  public async listProjects(userId: string) {
    return getPrisma().project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        prompt: true,
        status: true,
        currentVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete a project and all its versions/files (cascade).
   */
  public async deleteProject(userId: string, projectId: string) {
    await this.assertOwnership(userId, projectId);

    await getPrisma().project.delete({
      where: { id: projectId },
    });

    log.info({ userId, projectId }, 'Project deleted');
  }

  /**
   * Update the current version pointer (used by rollback).
   */
  public async setCurrentVersion(projectId: string, version: number) {
    return getPrisma().project.update({
      where: { id: projectId },
      data: { currentVersion: version, updatedAt: new Date() },
    });
  }

  // --- Private helpers ---

  private async assertOwnership(userId: string, projectId: string) {
    const project = await getPrisma().project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    if (project.userId !== userId) {
      throw new AuthorizationError('You do not have permission to access this project');
    }
  }
}

export const projectService = new ProjectService();
