// ============================================================
// BuildBot — Metadata Engine
// ============================================================
// Orchestrates validation, schema diffing, and database
// persistence for application definitions.
// ============================================================

import prisma from '@/lib/prisma';
import { ValidationEngine } from '../validation/validation-engine';
import { schemaRegistry } from './schema-registry';
import { MetadataValidationResult, AppDefinition } from '@/types/metadata.types';
import { createModuleLogger } from '@/lib/logger';
import { ConfigurationError } from '@/core/errors/app-error';
import { ErrorCode } from '@/core/errors/error-codes';

const log = createModuleLogger('metadata-engine');

export class MetadataEngine {
  private validator = new ValidationEngine();

  /**
   * Process a new or updated raw JSON app definition.
   */
  public async processDefinition(rawJson: string): Promise<MetadataValidationResult> {
    log.debug('Processing raw app definition');
    
    // 1. Run full validation pipeline
    const report = await this.validator.validateAppDefinition(rawJson);
    
    // 2. Identify valid entities (Partial Acceptance Strategy)
    // If we passed stage 1 & 2, we have a parsed structure.
    let appDefinition: AppDefinition | null = null;
    let validEntities = [];

    if (report.summary.stageReached === 'business_validation' || report.valid) {
      appDefinition = JSON.parse(rawJson) as AppDefinition;
      
      const entitiesWithErrors = new Set(
        report.errors.filter(e => e.entity).map(e => e.entity)
      );

      validEntities = appDefinition.entities.filter(
        e => !entitiesWithErrors.has(e.name)
      );
    }

    return {
      report,
      appDefinition,
      validEntities,
    };
  }

  /**
   * Persist a validated AppDefinition into the relational schema.
   * This handles both creation and updates, using a transaction.
   */
  public async persist(
    appId: string,
    userId: string,
    result: MetadataValidationResult,
    rawJson: string
  ): Promise<void> {
    // If it's fundamentally broken (JSON or schema level), mark invalid and store raw
    if (!result.appDefinition || result.validEntities.length === 0) {
      log.warn({ appId }, 'Persisting invalid app definition');
      
      await prisma.appDefinition.update({
        where: { id: appId },
        data: {
          status: 'invalid',
          rawDefinition: rawJson,
          validationReport: result.report as any,
        }
      });
      return;
    }

    log.info({ appId, validCount: result.validEntities.length }, 'Persisting valid entities');

    // Execute the complex relational update in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update the app record
      const app = await tx.appDefinition.update({
        where: { id: appId },
        data: {
          status: result.report.valid ? 'active' : 'draft', // Active if fully valid, Draft if partial
          appName: result.appDefinition!.appName,
          rawDefinition: rawJson,
          validationReport: result.report as any,
          version: { increment: 1 },
        }
      });

      // 2. Wipe existing entities and fields (for now, simpler than diffing in DB)
      // Since it cascades, deleting entities deletes fields.
      // In Phase 4 (Schema Evolution), we will use SchemaDiffer to do precise updates here.
      await tx.entityDefinition.deleteMany({
        where: { appId },
      });

      // 3. Insert valid entities and their fields
      let entitySortOrder = 0;
      for (const entity of result.validEntities) {
        const createdEntity = await tx.entityDefinition.create({
          data: {
            appId,
            name: entity.name,
            slug: entity.name.toLowerCase(),
            softDelete: entity.softDelete ?? true,
            timestamps: entity.timestamps ?? true,
            sortOrder: entitySortOrder++,
          }
        });

        let fieldSortOrder = 0;
        for (const field of entity.fields) {
          await tx.fieldDefinition.create({
            data: {
              entityId: createdEntity.id,
              name: field.name,
              fieldType: field.type,
              required: field.required ?? false,
              isUnique: field.unique ?? false,
              isIndexed: field.indexed ?? false,
              defaultValue: field.default !== undefined ? JSON.stringify(field.default) : null,
              validations: field.validations ? JSON.stringify(field.validations) : null,
              relationTarget: field.relation?.entity,
              relationType: field.relation?.type,
              sortOrder: fieldSortOrder++,
            }
          });
        }
      }
    });

    // Invalidate the cache for this app
    schemaRegistry.invalidate(appId);
  }
}

export const metadataEngine = new MetadataEngine();
