// ============================================================
// BuildBot — UI Generator
// ============================================================
// Deterministically transforms an AppDefinition into an 
// AppUIDefinition without any LLM intervention.
// ============================================================

import { AppDefinition, EntityDefinition, FieldDefinition } from '@/types/metadata.types';
import { 
  AppUIDefinition, 
  UITheme, 
  UINavigation, 
  UIPage, 
  UINavigationItem,
  UIComponent,
  FormConfig,
  TableConfig,
  DetailConfig,
  WidgetConfig
} from '@/types/ui-metadata.types';
import { createModuleLogger } from '@/lib/logger';

const log = createModuleLogger('ui-generator');

export class UIGenerator {
  public static generate(appDef: AppDefinition): AppUIDefinition {
    log.info({ appId: appDef.id }, 'Generating UI Definition');

    const theme = this.generateTheme();
    const pages = this.generatePages(appDef);
    const navigation = this.generateNavigation(appDef);

    return {
      theme,
      navigation,
      pages
    };
  }

  private static generateTheme(): UITheme {
    return {
      colors: {
        primary: '#4F46E5', // Indigo 600
        secondary: '#10B981', // Emerald 500
        background: '#F9FAFB', // Gray 50
        surface: '#FFFFFF',
        text: '#111827', // Gray 900
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        headingScale: 1.25
      },
      borderRadius: '0.5rem',
      spacing: '1rem',
      mode: 'light'
    };
  }

  private static generateNavigation(appDef: AppDefinition): UINavigation {
    const items: UINavigationItem[] = [];

    // 1. Dashboard first
    items.push({
      label: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard'
    });

    // 2. Entity pages next
    appDef.entities.forEach(entity => {
      // Basic fallback icon mapping based on entity name
      let icon = 'Database';
      const name = entity.name.toLowerCase();
      if (name.includes('user') || name.includes('customer') || name.includes('contact') || name.includes('employee')) icon = 'Users';
      else if (name.includes('company') || name.includes('organization')) icon = 'Building2';
      else if (name.includes('deal') || name.includes('order') || name.includes('invoice')) icon = 'DollarSign';
      else if (name.includes('product') || name.includes('item')) icon = 'Package';
      else if (name.includes('project') || name.includes('task')) icon = 'CheckSquare';
      else if (name.includes('settings')) icon = 'Settings';

      items.push({
        label: entity.name + 's',
        path: `/${entity.name.toLowerCase()}s`,
        icon
      });
    });

    return { items };
  }

  private static generatePages(appDef: AppDefinition): UIPage[] {
    const pages: UIPage[] = [];

    // 1. Dashboard
    pages.push(this.generateDashboard(appDef));

    // 2. Entity Pages (List, Create, Edit, Detail)
    appDef.entities.forEach(entity => {
      pages.push(this.generateListPage(entity));
      pages.push(this.generateFormPage(entity, 'create'));
      pages.push(this.generateFormPage(entity, 'edit'));
      pages.push(this.generateDetailPage(entity, appDef));
    });

    return pages;
  }

  private static generateDashboard(appDef: AppDefinition): UIPage {
    const children: UIComponent[] = [];

    // Metric Cards for top 4 entities
    const topEntities = appDef.entities.slice(0, 4);
    topEntities.forEach(entity => {
      children.push({
        id: `widget_metric_${entity.id}`,
        type: 'widget-metric',
        config: {
          entityId: entity.id,
          title: `Total ${entity.name}s`,
          metricType: 'count'
        } as WidgetConfig
      });
    });

    // Recent Records for primary entity
    if (appDef.entities.length > 0) {
      const primaryEntity = appDef.entities[0];
      children.push({
        id: `widget_recent_${primaryEntity.id}`,
        type: 'widget-recent',
        config: {
          entityId: primaryEntity.id,
          title: `Recent ${primaryEntity.name}s`,
          limit: 5
        } as WidgetConfig
      });
    }

    return {
      id: 'page_dashboard',
      type: 'dashboard',
      title: 'Dashboard',
      path: '/',
      layout: {
        type: 'grid',
        children
      }
    };
  }

  private static generateListPage(entity: EntityDefinition): UIPage {
    // Select first 5 scalar fields for columns
    const columns = entity.fields
      .filter(f => f.type !== 'relation' && f.type !== 'json')
      .slice(0, 5)
      .map(f => ({ fieldId: f.id, label: f.name }));

    // Fallback if no scalar fields (unlikely)
    if (columns.length === 0) {
      columns.push({ fieldId: 'id', label: 'ID' });
    }

    const tableConfig: TableConfig = {
      entityId: entity.id,
      columns,
      actions: ['create', 'view', 'edit', 'delete']
    };

    return {
      id: `page_${entity.id}_list`,
      type: 'list',
      title: `${entity.name}s`,
      path: `/${entity.name.toLowerCase()}s`,
      entityId: entity.id,
      layout: {
        type: 'container',
        children: [{
          id: `comp_${entity.id}_table`,
          type: 'table',
          config: tableConfig
        }]
      }
    };
  }

  private static generateFormPage(entity: EntityDefinition, mode: 'create' | 'edit'): UIPage {
    // Sort required fields first
    const sortedFields = [...entity.fields].sort((a, b) => {
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return 0;
    });

    const formFields = sortedFields.map(f => {
      let controlType: FormConfig['fields'][0]['controlType'] = 'text';
      
      if (f.type === 'number' || f.type === 'integer') controlType = 'number';
      else if (f.type === 'date' || f.type === 'datetime') controlType = 'date';
      else if (f.type === 'boolean') controlType = 'checkbox';
      else if (f.type === 'enum' || f.type === 'relation') controlType = 'select';
      else if (f.type === 'text') controlType = 'textarea';

      return {
        fieldId: f.id,
        controlType,
        required: !!f.required
      };
    });

    const formConfig: FormConfig = {
      entityId: entity.id,
      mode,
      fields: formFields
    };

    const capitalizedMode = mode.charAt(0).toUpperCase() + mode.slice(1);
    
    return {
      id: `page_${entity.id}_${mode}`,
      type: mode,
      title: `${capitalizedMode} ${entity.name}`,
      path: `/${entity.name.toLowerCase()}s/${mode === 'edit' ? ':id/edit' : 'new'}`,
      entityId: entity.id,
      layout: {
        type: 'container',
        children: [{
          id: `comp_${entity.id}_form_${mode}`,
          type: 'form',
          config: formConfig
        }]
      }
    };
  }

  private static generateDetailPage(entity: EntityDefinition, appDef: AppDefinition): UIPage {
    // Fields to display (skip large JSON fields typically)
    const displayFields = entity.fields
      .filter(f => f.type !== 'json')
      .map(f => f.id);

    // Find child entities (entities that belongTo this entity)
    const childTables: DetailConfig['childTables'] = [];
    
    appDef.entities.forEach(otherEntity => {
      otherEntity.fields.forEach(f => {
        if (f.type === 'relation' && f.relation?.type === 'belongsTo' && f.relation.entityId === entity.id) {
          childTables.push({
            entityId: otherEntity.id,
            relationFieldId: f.id,
            label: `${otherEntity.name}s`
          });
        }
      });
    });

    const detailConfig: DetailConfig = {
      entityId: entity.id,
      fields: displayFields,
      childTables
    };

    return {
      id: `page_${entity.id}_detail`,
      type: 'detail',
      title: `${entity.name} Details`,
      path: `/${entity.name.toLowerCase()}s/:id`,
      entityId: entity.id,
      layout: {
        type: 'stack',
        children: [{
          id: `comp_${entity.id}_detail`,
          type: 'detail',
          config: detailConfig
        }]
      }
    };
  }
}
