// ============================================================
// BuildBot — Context Aggregator
// ============================================================
// Loads the full current state of an app for refinement context.
// ============================================================

import { getPrisma } from '@/lib/prisma';
import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition } from '@/types/ui-metadata.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('context-aggregator');

export interface AppContext {
  appId: string;
  version: number;
  appDefinition: AppDefinition;
  uiDefinition: AppUIDefinition | null;
  entityGraph: string; // human-readable summary for AI context
}

export class ContextAggregator {
  /**
   * Loads the current app state from the database and builds
   * a structured context object for the refinement AI.
   */
  public static async loadContext(appId: string): Promise<AppContext> {
    const appModel = await getPrisma().appDefinition.findUnique({ where: { id: appId } });

    if (!appModel) {
      throw new Error(`App not found: ${appId}`);
    }

    const appDefinition = (
      typeof appModel.rawDefinition === 'string'
        ? JSON.parse(appModel.rawDefinition)
        : appModel.rawDefinition
    ) as AppDefinition;

    const uiDefinition = appModel.uiDefinition
      ? (typeof appModel.uiDefinition === 'string'
          ? JSON.parse(appModel.uiDefinition)
          : appModel.uiDefinition) as AppUIDefinition
      : null;

    const entityGraph = this.buildEntityGraph(appDefinition);

    log.info({ appId, version: appModel.version }, 'Loaded app context for refinement');

    return {
      appId,
      version: appModel.version,
      appDefinition,
      uiDefinition,
      entityGraph,
    };
  }

  /**
   * Builds a human-readable entity graph summary for the AI prompt.
   */
  private static buildEntityGraph(appDef: AppDefinition): string {
    const lines: string[] = [];
    lines.push(`App: ${appDef.appName}`);
    lines.push(`Entities: ${appDef.entities.length}`);
    lines.push('');

    appDef.entities.forEach(entity => {
      lines.push(`Entity: ${entity.name} (id: ${entity.id})`);
      entity.fields.forEach(field => {
        let desc = `  - ${field.name} (${field.type})`;
        if (field.required) desc += ' [required]';
        if (field.unique) desc += ' [unique]';
        if (field.type === 'relation' && field.relation) {
          desc += ` → ${field.relation.entityId} (${field.relation.type})`;
        }
        if (field.type === 'enum' && field.enumValues) {
          desc += ` [${field.enumValues.join(', ')}]`;
        }
        lines.push(desc);
      });
      lines.push('');
    });

    return lines.join('\n');
  }
}
