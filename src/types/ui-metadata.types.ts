// ============================================================
// BuildBot — UI Metadata Types
// ============================================================

export interface AppUIDefinition {
  theme: UITheme;
  navigation: UINavigation;
  pages: UIPage[];
}

export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingScale: number;
  };
  borderRadius: string;
  spacing: string;
  mode: 'light' | 'dark' | 'system';
}

export interface UINavigation {
  items: UINavigationItem[];
}

export interface UINavigationItem {
  label: string;
  path: string;
  icon: string;
}

export type UIPageType = 'dashboard' | 'list' | 'create' | 'edit' | 'detail' | 'custom';

export interface UIPage {
  id: string;
  type: UIPageType;
  title: string;
  path: string;
  entityId?: string;
  layout: UILayout;
}

export interface UILayout {
  type: 'container' | 'grid' | 'stack';
  children: UIComponent[];
}

export type UIComponentType = 
  | 'table'
  | 'form'
  | 'detail'
  | 'widget-metric'
  | 'widget-recent';

export interface UIComponent {
  id: string;
  type: UIComponentType;
  config: TableConfig | FormConfig | DetailConfig | WidgetConfig;
}

export interface TableConfig {
  entityId: string;
  columns: { fieldId: string; label: string }[];
  actions: ('create' | 'edit' | 'delete' | 'view')[];
}

export interface FormConfig {
  entityId: string;
  mode: 'create' | 'edit';
  fields: { 
    fieldId: string; 
    controlType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
    required: boolean;
  }[];
}

export interface DetailConfig {
  entityId: string;
  fields: string[];
  childTables: { entityId: string; relationFieldId: string; label: string }[];
}

export interface WidgetConfig {
  entityId?: string;
  title: string;
  metricType?: 'count' | 'sum' | 'average';
  metricField?: string;
  limit?: number;
}
