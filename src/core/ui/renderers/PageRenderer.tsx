"use client";

import React from 'react';
import { UIPage } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import ComponentRenderer from './ComponentRenderer';
import { cn } from './SidebarRenderer';

interface PageRendererProps {
  page: UIPage;
  appId: string;
  appDefinition: AppDefinition;
}

export default function PageRenderer({ page, appId, appDefinition }: PageRendererProps) {
  const { layout, title } = page;

  const renderLayout = () => {
    switch (layout.type) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {layout.children.map(comp => (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                appId={appId}
                appDefinition={appDefinition}
              />
            ))}
          </div>
        );
      case 'stack':
        return (
          <div className="flex flex-col gap-6">
            {layout.children.map(comp => (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                appId={appId}
                appDefinition={appDefinition}
              />
            ))}
          </div>
        );
      case 'container':
      default:
        return (
          <div className="flex flex-col gap-4">
            {layout.children.map(comp => (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                appId={appId}
                appDefinition={appDefinition}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      {renderLayout()}
    </div>
  );
}
