// ============================================================
// BuildBot — UI Validator
// ============================================================
// Verifies that a generated AppUIDefinition is structurally
// sound and all references to AppDefinition are valid.
// ============================================================

import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition, UIPage, UIComponent, TableConfig, FormConfig, DetailConfig, WidgetConfig } from '@/types/ui-metadata.types';

export class UIValidator {
  /**
   * Validates the AppUIDefinition against the Domain AppDefinition.
   * Throws an error if validation fails.
   */
  public static validate(uiDef: AppUIDefinition, appDef: AppDefinition): void {
    const pagePaths = new Set<string>();
    const pageIds = new Set<string>();

    for (const page of uiDef.pages) {
      // 1. Verify page integrity
      if (pageIds.has(page.id)) {
        throw new Error(`Duplicate page ID found: ${page.id}`);
      }
      pageIds.add(page.id);

      if (pagePaths.has(page.path)) {
        throw new Error(`Duplicate page path found: ${page.path}`);
      }
      pagePaths.add(page.path);

      // Verify entity reference if present
      if (page.entityId) {
        this.verifyEntity(page.entityId, appDef);
      }

      // Verify components
      for (const comp of page.layout.children) {
        this.validateComponent(comp, appDef);
      }
    }
  }

  private static validateComponent(comp: UIComponent, appDef: AppDefinition): void {
    switch (comp.type) {
      case 'table': {
        const config = comp.config as TableConfig;
        this.verifyEntity(config.entityId, appDef);
        const entity = appDef.entities.find(e => e.id === config.entityId)!;
        config.columns.forEach(col => this.verifyField(col.fieldId, entity));
        break;
      }
      case 'form': {
        const config = comp.config as FormConfig;
        this.verifyEntity(config.entityId, appDef);
        const entity = appDef.entities.find(e => e.id === config.entityId)!;
        config.fields.forEach(f => this.verifyField(f.fieldId, entity));
        break;
      }
      case 'detail': {
        const config = comp.config as DetailConfig;
        this.verifyEntity(config.entityId, appDef);
        const entity = appDef.entities.find(e => e.id === config.entityId)!;
        config.fields.forEach(fId => this.verifyField(fId, entity));
        
        config.childTables.forEach(ct => {
          this.verifyEntity(ct.entityId, appDef);
          const childEntity = appDef.entities.find(e => e.id === ct.entityId)!;
          this.verifyField(ct.relationFieldId, childEntity);
        });
        break;
      }
      case 'widget-metric':
      case 'widget-recent': {
        const config = comp.config as WidgetConfig;
        if (config.entityId) {
          this.verifyEntity(config.entityId, appDef);
          if (config.metricField) {
            const entity = appDef.entities.find(e => e.id === config.entityId)!;
            this.verifyField(config.metricField, entity);
          }
        }
        break;
      }
    }
  }

  private static verifyEntity(entityId: string, appDef: AppDefinition): void {
    const exists = appDef.entities.some(e => e.id === entityId);
    if (!exists) {
      throw new Error(`UI references non-existent entity: ${entityId}`);
    }
  }

  private static verifyField(fieldId: string, entity: any): void {
    // "id" is a standard system field even if not in the explicit fields list sometimes,
    // but in our schema, everything is explicit or we can allow 'id' natively.
    if (fieldId === 'id') return;
    
    const exists = entity.fields.some((f: any) => f.id === fieldId);
    if (!exists) {
      throw new Error(`UI references non-existent field: ${fieldId} on entity: ${entity.id}`);
    }
  }
}
