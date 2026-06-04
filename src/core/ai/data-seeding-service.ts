// ============================================================
// BuildBot — Data Seeding Service
// ============================================================
// Generates and inserts sample data into Draft applications.
// ============================================================

import { AppDefinition, EntityDefinition } from '@/types/metadata.types';
import { ArchetypeType } from './archetypes/archetype.types';
import { TopologicalSorter } from './topological-sorter';
import { OperationExecutor } from '../runtime/operation-executor';
import { createModuleLogger } from '@/lib/logger';
import { SeedTemplates } from './seed-templates';
import { RuntimeContext } from '@/types/runtime.types';

const log = createModuleLogger('data-seeding');

export type SeedStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface SeedProgress {
  status: SeedStatus;
  message?: string;
}

export class DataSeedingService {
  private statusMap = new Map<string, SeedProgress>();
  private executor = new OperationExecutor();

  public getStatus(appId: string): SeedProgress {
    return this.statusMap.get(appId) || { status: 'PENDING' };
  }

  /**
   * Starts the async seeding process.
   * Does not return a promise, as it runs in the background.
   */
  public triggerSeed(appId: string, userId: string, appDef: AppDefinition, archetype: ArchetypeType): void {
    // Run asynchronously
    this.seed(appId, userId, appDef, archetype).catch(err => {
      log.error({ err, appId }, 'Unhandled error in triggerSeed');
    });
  }

  private async seed(appId: string, userId: string, appDef: AppDefinition, archetype: ArchetypeType): Promise<void> {
    this.statusMap.set(appId, { status: 'RUNNING', message: 'Analyzing dependencies...' });
    
    try {
      const sortedEntities = TopologicalSorter.sortEntities(appDef);
      const contextTemplate = SeedTemplates.getContext(archetype);
      
      // Store created IDs for relation linking: Record<EntityId, string[]>
      const createdIds: Record<string, string[]> = {};

      for (const entity of sortedEntities) {
        this.statusMap.set(appId, { status: 'RUNNING', message: `Seeding ${entity.name}...` });
        
        const recordsToCreate = this.generateRecords(entity, contextTemplate, createdIds);
        const entityIds: string[] = [];

        // Synthesize context for the OperationExecutor
        const ctx: RuntimeContext = {
          user: { userId, email: 'seed@buildbot.internal' },
          app: appDef,
          entity: entity,
          operation: 'CREATE',
          req: new Request('http://localhost')
        };

        for (const record of recordsToCreate) {
          try {
            const result = await this.executor.create(ctx, record);
            if (result.data && result.data.id) {
              entityIds.push(result.data.id);
            }
          } catch (e) {
            log.warn({ err: e, entity: entity.name }, 'Failed to insert sample record');
            // Continue with other records
          }
        }
        
        createdIds[entity.id] = entityIds;
      }

      this.statusMap.set(appId, { status: 'COMPLETED', message: 'Seeding finished.' });
      log.info({ appId }, 'Seeding completed successfully');

    } catch (error) {
      log.error({ err: error, appId }, 'Seeding failed');
      this.statusMap.set(appId, { 
        status: 'FAILED', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private generateRecords(
    entity: EntityDefinition, 
    contextTemplate: any, 
    createdIds: Record<string, string[]>
  ): any[] {
    const belongsToFields = entity.fields.filter(f => f.type === 'relation' && f.relation?.type === 'belongsTo');
    
    let count = 5;
    const parentIdsList: { field: string, ids: string[] }[] = [];

    if (belongsToFields.length > 0) {
      count = 15; // Generate more children records
      belongsToFields.forEach(f => {
        const targetIds = createdIds[f.relation!.entityId];
        if (targetIds && targetIds.length > 0) {
          parentIdsList.push({ field: f.id, ids: targetIds });
        }
      });
      // If we couldn't resolve parent IDs, we'll still generate some but they might fail validation
    }

    const records = [];
    for (let i = 0; i < count; i++) {
      const record: any = {};
      
      // Map Foreign Keys
      parentIdsList.forEach(parent => {
        record[parent.field] = parent.ids[Math.floor(Math.random() * parent.ids.length)];
      });

      // Map Scalars
      entity.fields.forEach(f => {
        if (f.type !== 'relation' && !record[f.id]) {
          record[f.id] = this.generateScalarValue(f, i, contextTemplate, entity.name);
        }
      });
      
      records.push(record);
    }

    return records;
  }

  private generateScalarValue(field: any, index: number, contextTemplate: any, entityName: string): any {
    const fname = field.name.toLowerCase();
    
    if (field.type === 'string' || field.type === 'text') {
      if (fname.includes('email')) return `user${index}@example.com`;
      if (fname.includes('phone')) return `555-010${index}`;
      if (fname.includes('name')) {
        // Try to pick from context based on entity name
        const arr = contextTemplate[entityName.toLowerCase() + 's'] || contextTemplate.names || [];
        if (arr.length > 0) {
          return arr[index % arr.length] + (index >= arr.length ? ` ${index}` : '');
        }
        return `${entityName} ${index + 1}`;
      }
      if (fname.includes('description')) return `This is a sample description for ${entityName} ${index + 1}.`;
      return `Sample ${field.name} ${index}`;
    }
    
    if (field.type === 'number' || field.type === 'integer') {
      if (fname.includes('amount') || fname.includes('price')) return 100 * (index + 1);
      if (fname.includes('quantity') || fname.includes('stock')) return 10 * (index + 1);
      return index + 1;
    }
    
    if (field.type === 'boolean') {
      return index % 2 === 0;
    }

    if (field.type === 'date' || field.type === 'datetime') {
      return new Date().toISOString();
    }

    return null;
  }
}

export const dataSeedingService = new DataSeedingService();
