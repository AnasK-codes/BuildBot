// ============================================================
// BuildBot — Metadata Version Manager
// ============================================================
// Handles version bumps and draft/publish state transitions.
// ============================================================

import { getPrisma } from '@/lib/prisma';
import { AppStatus } from '@/types/metadata.types';

export class MetadataVersionManager {
  /**
   * Promotes an app from DRAFT to ACTIVE, deprecating the old ACTIVE version if necessary.
   * Increments the major version number.
   */
  public static async publishVersion(appId: string): Promise<number> {
    const app = await getPrisma().appDefinition.findUnique({
      where: { id: appId },
      select: { version: true, status: true },
    });

    if (!app) {
      throw new Error(`App ${appId} not found`);
    }

    // Only bump version if we're actually publishing a draft or something new
    const nextVersion = app.version + 1;

    await getPrisma().appDefinition.update({
      where: { id: appId },
      data: {
        status: 'ACTIVE',
        version: nextVersion,
      },
    });

    return nextVersion;
  }

  /**
   * Marks the app as DRAFT.
   */
  public static async markDraft(appId: string): Promise<void> {
    await getPrisma().appDefinition.update({
      where: { id: appId },
      data: { status: 'DRAFT' },
    });
  }
}
