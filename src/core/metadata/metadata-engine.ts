// ============================================================
// BuildBot — Metadata Engine (Phase 4 Refactor)
// ============================================================
// Integrates Schema Evolution, Safe Workflow, and Audit Logging.
// ============================================================

import prisma from '@/lib/prisma';
import { ValidationEngine } from '../validation/validation-engine';
import { schemaRegistry } from './schema-registry';
import { MetadataValidationResult, AppDefinition, AppStatus } from '@/types/metadata.types';
import { createModuleLogger } from '@/lib/logger';
import { EvolutionReportGenerator } from '../evolution/report-generator';
import { SchemaEvolutionReport } from '../evolution/evolution.types';
import { auditService } from './audit-service';
import { MetadataVersionManager } from './version-manager';
import { ValidationError } from '@/core/errors';

const log = createModuleLogger('metadata-engine');

export class MetadataEngine {
  private validator = new ValidationEngine();

  public async processDefinition(rawJson: string): Promise<MetadataValidationResult> {
    const report = await this.validator.validateAppDefinition(rawJson);
    
    let appDefinition: AppDefinition | null = null;
    let validEntities = [];

    if (report.summary.stageReached === 'business_validation' || report.valid) {
      appDefinition = JSON.parse(rawJson) as AppDefinition;
      const entitiesWithErrors = new Set(report.errors.filter(e => e.entity).map(e => e.entity));
      validEntities = appDefinition.entities.filter(e => !entitiesWithErrors.has(e.name));
    }

    return { report, appDefinition, validEntities };
  }

  /**
   * Persists an AppDefinition using the Safe Update Workflow.
   */
  public async persist(
    appId: string,
    userId: string,
    result: MetadataValidationResult,
    rawJson: string,
    forcePublishBreaking: boolean = false
  ): Promise<void> {
    
    if (!result.appDefinition || result.validEntities.length === 0) {
      await this.saveInvalid(appId, rawJson, result);
      return;
    }

    // Load current active definition for Diffing
    const oldApp = await schemaRegistry.getAppDefinition(appId);
    let evolutionReport: SchemaEvolutionReport | null = null;

    if (oldApp) {
      // 1. Generate Diff and Impact Analysis
      evolutionReport = EvolutionReportGenerator.generate(oldApp, result.appDefinition);
      
      // 2. Reject if breaking changes are present and not explicitly forced
      if (evolutionReport.summary.highestSeverity === 'BREAKING' && !forcePublishBreaking) {
        throw new ValidationError('Breaking changes detected. Must explicitly force publish.', {
          breakingChanges: evolutionReport.breakingChanges,
          migrationRequirements: evolutionReport.migrationRequirements,
        });
      }
    }

    // 3. Apply Surgical Updates
    await prisma.$transaction(async (tx) => {
      const currentApp = await tx.appDefinition.findUnique({ where: { id: appId } });
      const nextVersion = (currentApp?.version || 1) + 1;

      // Update App level metadata
      await tx.appDefinition.update({
        where: { id: appId },
        data: {
          status: result.report.valid ? 'ACTIVE' : 'DRAFT',
          appName: result.appDefinition!.appName,
          rawDefinition: rawJson,
          validationReport: result.report as any,
          version: nextVersion,
        }
      });

      if (oldApp && evolutionReport) {
        // --- SURGICAL SCHEMA UPDATE (Phase 4) ---
        // Instead of deleteMany, we update/insert/deprecate based on the schema differ report
        
        // Find entities/fields to deprecate
        for (const req of evolutionReport.migrationRequirements) {
          if (req.action === 'MARK_DEPRECATED') {
            if (req.fieldId) {
              await tx.fieldDefinition.update({
                where: { id: req.fieldId }, // Requires stable IDs to map correctly to DB ID, which is slightly tricky if we used cuid for DB ID and something else for stable ID.
                // Assuming stableId is matched here. Let's do it by stableId!
              });
              // Wait, prisma field definition id is cuid, stableId is what user provides.
            }
          }
        }
      }

      // To fully implement surgical updates based purely on the new payload:
      // We upsert all incoming entities and fields by their `stableId`.
      // Anything in the DB that is NOT in the incoming payload gets marked as deprecated.

      const incomingEntityStableIds = new Set(result.validEntities.map(e => e.id));
      
      // Deprecate entities not in incoming payload
      await tx.entityDefinition.updateMany({
        where: { appId, stableId: { notIn: Array.from(incomingEntityStableIds) }, deprecatedAt: null },
        data: { deprecatedAt: new Date(), deprecationReason: 'Removed in schema update' }
      });

      let entitySortOrder = 0;
      for (const entity of result.validEntities) {
        
        // Upsert Entity
        const dbEntity = await tx.entityDefinition.upsert({
          where: { stableId: entity.id },
          create: {
            appId,
            name: entity.name,
            slug: entity.name.toLowerCase(),
            stableId: entity.id,
            softDelete: entity.softDelete ?? true,
            timestamps: entity.timestamps ?? true,
            sortOrder: entitySortOrder++,
          },
          update: {
            name: entity.name,
            slug: entity.name.toLowerCase(),
            softDelete: entity.softDelete ?? true,
            timestamps: entity.timestamps ?? true,
            sortOrder: entitySortOrder++,
            deprecatedAt: null, // restore if it was deprecated
          }
        });

        const incomingFieldStableIds = new Set(entity.fields.map(f => f.id));

        // Deprecate fields not in incoming payload for this entity
        await tx.fieldDefinition.updateMany({
          where: { entityId: dbEntity.id, stableId: { notIn: Array.from(incomingFieldStableIds) }, deprecatedAt: null },
          data: { deprecatedAt: new Date(), deprecationReason: 'Removed in schema update' }
        });

        let fieldSortOrder = 0;
        for (const field of entity.fields) {
          await tx.fieldDefinition.upsert({
            where: { entityId_stableId: { entityId: dbEntity.id, stableId: field.id } },
            create: {
              entityId: dbEntity.id,
              name: field.name,
              stableId: field.id,
              fieldType: field.type,
              required: field.required ?? false,
              isUnique: field.unique ?? false,
              isIndexed: field.indexed ?? false,
              defaultValue: field.default !== undefined ? JSON.stringify(field.default) : null,
              validations: field.validations ? JSON.stringify(field.validations) : null,
              relationTarget: field.relation?.entityId,
              relationType: field.relation?.type,
              sortOrder: fieldSortOrder++,
            },
            update: {
              name: field.name,
              fieldType: field.type,
              required: field.required ?? false,
              isUnique: field.unique ?? false,
              isIndexed: field.indexed ?? false,
              defaultValue: field.default !== undefined ? JSON.stringify(field.default) : null,
              validations: field.validations ? JSON.stringify(field.validations) : null,
              relationTarget: field.relation?.entityId,
              relationType: field.relation?.type,
              sortOrder: fieldSortOrder++,
              deprecatedAt: null,
            }
          });
        }
      }
    });

    // 4. Create Audit Log
    if (oldApp && evolutionReport) {
      const currentApp = await prisma.appDefinition.findUnique({ where: { id: appId } });
      await auditService.logChange(appId, userId, oldApp.version || 1, currentApp?.version || 1, evolutionReport);
    }

    // 5. Cache Invalidation
    schemaRegistry.invalidate(appId);
  }

  private async saveInvalid(appId: string, rawJson: string, result: MetadataValidationResult) {
    await prisma.appDefinition.update({
      where: { id: appId },
      data: {
        status: 'INVALID',
        rawDefinition: rawJson,
        validationReport: result.report as any,
      }
    });
  }
}

export const metadataEngine = new MetadataEngine();
