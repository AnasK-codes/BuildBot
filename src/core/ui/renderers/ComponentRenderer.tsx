"use client";

import React from 'react';
import { UIComponent } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import DynamicTable from './DynamicTable';
import DynamicForm from './DynamicForm';
import DetailView from './DetailView';
import { MetricWidget, RecentRecordsWidget } from './DashboardWidgets';

interface ComponentRendererProps {
  component: UIComponent;
  appId: string;
  appDefinition: AppDefinition;
}

export default function ComponentRenderer({ component, appId, appDefinition }: ComponentRendererProps) {
  switch (component.type) {
    case 'table':
      return <DynamicTable config={component.config as any} appId={appId} appDefinition={appDefinition} />;
    case 'form':
      return <DynamicForm config={component.config as any} appId={appId} appDefinition={appDefinition} />;
    case 'detail':
      return <DetailView config={component.config as any} appId={appId} appDefinition={appDefinition} />;
    case 'widget-metric':
      return <MetricWidget config={component.config as any} appId={appId} />;
    case 'widget-recent':
      return <RecentRecordsWidget config={component.config as any} appId={appId} appDefinition={appDefinition} />;
    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700 text-sm">
          Unknown component type: {(component as any).type}
        </div>
      );
  }
}
