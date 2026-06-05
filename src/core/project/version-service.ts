// ============================================================
// BuildBot — Version Service
// ============================================================
// Manages version creation, listing, and rollback for projects.
// ============================================================

import { getPrisma } from '@/lib/prisma';
import { NotFoundError } from '@/core/errors';
import { GeneratedFileData } from '@/types/project.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('version-service');

export class VersionService {
  /**
   * Create a new version with its files.
   */
  public async createVersion(
    projectId: string,
    version: number,
    prompt: string,
    files: GeneratedFileData[],
    parentVersion?: number,
    validationReport?: object,
  ) {
    log.info({ projectId, version }, 'Creating new version');

    const versionRecord = await getPrisma().generatedVersion.create({
      data: {
        projectId,
        version,
        prompt,
        parentVersion: parentVersion ?? null,
        status: 'VALID',
        validationReport: validationReport as any ?? null,
        files: {
          create: files.map(f => ({
            path: f.path,
            content: f.content,
            language: f.language,
            sizeBytes: f.sizeBytes,
            checksum: f.checksum,
          })),
        },
      },
      include: { files: true },
    });

    return versionRecord;
  }

  /**
   * List all versions for a project (summary, no file content).
   */
  public async listVersions(projectId: string) {
    return getPrisma().generatedVersion.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        prompt: true,
        parentVersion: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get files for a specific version.
   */
  public async getVersionFiles(projectId: string, version: number) {
    const versionRecord = await getPrisma().generatedVersion.findUnique({
      where: { projectId_version: { projectId, version } },
      include: { files: true },
    });

    if (!versionRecord) {
      throw new NotFoundError('Version', `${projectId}@v${version}`);
    }

    return versionRecord;
  }

  /**
   * Get the current version number for a project.
   */
  public async getCurrentVersion(projectId: string): Promise<number> {
    const project = await getPrisma().project.findUnique({
      where: { id: projectId },
      select: { currentVersion: true },
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    return project.currentVersion;
  }

  /**
   * Rollback to a specific version. Does NOT delete newer versions.
   * Simply updates the project's currentVersion pointer.
   */
  public async rollback(projectId: string, targetVersion: number) {
    // Verify the target version exists
    const versionRecord = await getPrisma().generatedVersion.findUnique({
      where: { projectId_version: { projectId, version: targetVersion } },
    });

    if (!versionRecord) {
      throw new NotFoundError('Version', `${projectId}@v${targetVersion}`);
    }

    // Update project pointer
    const project = await getPrisma().project.update({
      where: { id: projectId },
      data: {
        currentVersion: targetVersion,
        updatedAt: new Date(),
      },
    });

    log.info({ projectId, targetVersion }, 'Rolled back to version');

    return project;
  }
}

export const versionService = new VersionService();
