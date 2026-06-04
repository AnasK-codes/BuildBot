// ============================================================
// BuildBot — App Shell Layout
// ============================================================
// Server Component: loads AppDefinition + AppUIDefinition from DB,
// provides PageContext and QueryClient, renders the persistent sidebar.
// ============================================================

import React from 'react';
import { notFound } from 'next/navigation';
import '../../../app/globals.css';
import prisma from '@/lib/prisma';
import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition } from '@/types/ui-metadata.types';
import { PageContextProvider } from '@/lib/page-context';
import SidebarRenderer from '@/core/ui/renderers/SidebarRenderer';
import { MetadataErrorBoundary } from '@/core/ui/renderers/MetadataErrorBoundary';

export const dynamic = 'force-dynamic';

export default async function AppShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { appId: string };
}) {
  const { appId } = params;

  const appModel = await prisma.appDefinition.findUnique({ where: { id: appId } });
  if (!appModel?.uiDefinition) return notFound();

  const appDefinition = (
    typeof appModel.rawDefinition === 'string'
      ? JSON.parse(appModel.rawDefinition)
      : appModel.rawDefinition
  ) as AppDefinition;

  const uiDefinition = (
    typeof appModel.uiDefinition === 'string'
      ? JSON.parse(appModel.uiDefinition)
      : appModel.uiDefinition
  ) as AppUIDefinition;

  const contextValue = {
    appId,
    appDefinition,
    uiDefinition,
    navigation: uiDefinition.navigation,
    theme: uiDefinition.theme,
  };

  return (
    <MetadataErrorBoundary>
      <PageContextProvider value={contextValue}>
        <div className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans antialiased">
          <SidebarRenderer uiDef={uiDefinition} appId={appId} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </PageContextProvider>
    </MetadataErrorBoundary>
  );
}
