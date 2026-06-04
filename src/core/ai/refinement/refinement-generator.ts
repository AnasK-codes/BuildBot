// ============================================================
// BuildBot — Refinement Generator
// ============================================================
// Orchestrates the full AI refinement pipeline:
// Context → Prompt → AI → Validate → Diff → Preview → Apply
// ============================================================

import { AppDefinition } from '@/types/metadata.types';
import { ContextAggregator, AppContext } from './context-aggregator';
import { RefinementPromptBuilder } from './refinement-prompt-builder';
import { RefinementPreview, RefinementResult, RefinementImpact } from './refinement.types';
import { ProviderFactory } from '../providers/provider-factory';
import { ValidationRepairLoop } from '../repair-loop';
import { ValidationEngine } from '../../validation/validation-engine';
import { EvolutionReportGenerator } from '../../evolution/report-generator';
import { UIGenerator } from '../../ui/ui-generator';
import { UIValidator } from '../../ui/ui-validator';
import { dataSeedingService } from '../data-seeding-service';
import { IntentClassifier } from '../archetypes/intent-classifier';
import prisma from '@/lib/prisma';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('refinement-generator');

export class RefinementGenerator {
  private provider = ProviderFactory.getProvider();
  private repairLoop = new ValidationRepairLoop(this.provider);

  /**
   * Generate a preview of what the refinement would change
   * WITHOUT persisting anything.
   */
  public async preview(appId: string, instruction: string): Promise<RefinementPreview> {
    const context = await ContextAggregator.loadContext(appId);
    const refinedDef = await this.generateRefinedDefinition(context, instruction);
    return this.buildPreview(context.appDefinition, refinedDef);
  }

  /**
   * Execute the full refinement: generate, validate, diff, persist new version.
   */
  public async apply(appId: string, userId: string, instruction: string): Promise<RefinementResult> {
    log.info({ appId, instruction }, 'Starting refinement');

    // 1. Load current context
    const context = await ContextAggregator.loadContext(appId);

    // 2. Generate refined definition via AI
    const refinedDef = await this.generateRefinedDefinition(context, instruction);

    // 3. Run schema evolution (diff + impact analysis)
    const evolutionReport = EvolutionReportGenerator.generate(context.appDefinition, refinedDef);
    log.info({ changes: evolutionReport.summary.totalChanges, severity: evolutionReport.summary.highestSeverity }, 'Evolution report generated');

    // 4. Generate new UI definition
    const uiDefinition = UIGenerator.generate(refinedDef);
    UIValidator.validate(uiDefinition, refinedDef);

    // 5. Persist as new version
    const newVersion = context.version + 1;
    await prisma.appDefinition.update({
      where: { id: appId },
      data: {
        rawDefinition: JSON.stringify(refinedDef) as any,
        uiDefinition: uiDefinition as any,
        version: newVersion,
        validationReport: evolutionReport as any,
      }
    });

    await prisma.appVersionHistory.create({
      data: {
        appId: appId,
        version: newVersion,
        appDefinition: refinedDef as any,
        uiDefinition: uiDefinition as any,
        changeSummary: evolutionReport as any,
      }
    });

    log.info({ appId, newVersion }, 'Refinement persisted');

    // 6. Seed data for NEW entities only (don't destroy existing records)
    const addedEntityIds = new Set(
      evolutionReport.safeChanges
        .filter(c => c.type === 'ENTITY_ADDED')
        .map(c => c.entityId)
    );

    if (addedEntityIds.size > 0) {
      // Build a partial AppDefinition with only the new entities
      const partialDef: AppDefinition = {
        ...refinedDef,
        id: appId,
        entities: refinedDef.entities.filter(e => addedEntityIds.has(e.id))
      };
      
      const archetype = IntentClassifier.detectArchetype(instruction).type;
      dataSeedingService.triggerSeed(appId, userId, partialDef, archetype);
      log.info({ newEntities: addedEntityIds.size }, 'Triggered sample data for new entities');
    }

    return {
      originalDefinition: context.appDefinition,
      refinedDefinition: refinedDef,
      evolutionReport,
      uiDefinition,
      newVersion,
      appId,
    };
  }

  /**
   * Internal: generate the refined AppDefinition via AI + validation.
   */
  private async generateRefinedDefinition(context: AppContext, instruction: string): Promise<AppDefinition> {
    const systemPrompt = RefinementPromptBuilder.buildSystemPrompt();
    const userPrompt = RefinementPromptBuilder.buildUserPrompt(context, instruction);

    const result = await this.repairLoop.execute(systemPrompt, userPrompt, 3, true);

    if (!result.report.valid || !result.appDefinition) {
      throw new Error(`Refinement failed validation after repair attempts. Errors: ${JSON.stringify(result.report.errors)}`);
    }

    return result.appDefinition;
  }

  /**
   * Build a human-readable preview from the diff.
   */
  private buildPreview(original: AppDefinition, refined: AppDefinition): RefinementPreview {
    const report = EvolutionReportGenerator.generate(original, refined);
    const allChanges = [...report.safeChanges, ...report.warningChanges, ...report.breakingChanges];

    const addedEntities = allChanges.filter(c => c.type === 'ENTITY_ADDED').map(c => c.entityName);
    const removedEntities = allChanges.filter(c => c.type === 'ENTITY_REMOVED').map(c => c.entityName);
    const addedFields = allChanges.filter(c => c.type === 'FIELD_ADDED').map(c => ({ entity: c.entityName, field: c.fieldName! }));
    const removedFields = allChanges.filter(c => c.type === 'FIELD_REMOVED').map(c => ({ entity: c.entityName, field: c.fieldName! }));
    const renamedEntities = allChanges.filter(c => c.type === 'ENTITY_RENAMED').map(c => ({ from: String(c.oldValue), to: String(c.newValue) }));
    const renamedFields = allChanges.filter(c => c.type === 'FIELD_RENAMED').map(c => ({ entity: c.entityName, from: String(c.oldValue), to: String(c.newValue) }));
    const relationshipChanges = allChanges.filter(c => c.type === 'RELATION_CHANGED').map(c => c.details);

    return {
      addedEntities,
      removedEntities,
      addedFields,
      removedFields,
      renamedEntities,
      renamedFields,
      relationshipChanges,
      safeChanges: report.safeChanges.length,
      warnings: report.warningChanges.length,
      breakingChanges: report.breakingChanges.length,
      evolutionReport: report,
    };
  }
}

export const refinementGenerator = new RefinementGenerator();
