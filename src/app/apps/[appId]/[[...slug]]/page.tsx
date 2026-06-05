// ============================================================
// BuildBot — Dynamic App Pages (catch-all route)
// ============================================================
// Resolves any /apps/[appId]/...slug path to a UIPage from
// the stored AppUIDefinition and renders it.
// ============================================================

import { notFound } from 'next/navigation';
import { getPrisma } from '@/lib/prisma';
import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition, UIPage } from '@/types/ui-metadata.types';
import PageRenderer from '@/core/ui/renderers/PageRenderer';
import DynamicForm from '@/core/ui/renderers/DynamicForm';
import DetailView from '@/core/ui/renderers/DetailView';

interface PageProps {
  params: Promise<{ appId: string; slug?: string[] }>;
}

function matchPage(pages: UIPage[], slug: string[]): UIPage | undefined {
  const currentPath = '/' + slug.join('/');

  // 1. Try exact match first
  const exact = pages.find(p => p.path === currentPath);
  if (exact) return exact;

  // 2. Match parameterized paths like /:id, /:id/edit
  for (const page of pages) {
    const patternParts = page.path.split('/').filter(Boolean);
    const slugParts = slug.filter(Boolean);
    if (patternParts.length !== slugParts.length) continue;

    const isMatch = patternParts.every((part, i) => part.startsWith(':') || part === slugParts[i]);
    if (isMatch) return page;
  }
  return undefined;
}

export default async function DynamicAppPage(props: PageProps) {
  const params = await props.params;
  const { appId, slug = [] } = params;

  const appModel = await getPrisma().appDefinition.findUnique({ where: { id: appId } });
  if (!appModel?.uiDefinition) return notFound();

  const appDefinition = (typeof appModel.rawDefinition === 'string'
    ? JSON.parse(appModel.rawDefinition)
    : appModel.rawDefinition) as AppDefinition;

  const uiDefinition = (typeof appModel.uiDefinition === 'string'
    ? JSON.parse(appModel.uiDefinition)
    : appModel.uiDefinition) as AppUIDefinition;

  // Route: /apps/[appId] → dashboard
  if (slug.length === 0) {
    const dashboardPage = uiDefinition.pages.find(p => p.type === 'dashboard');
    if (!dashboardPage) return notFound();
    return <PageRenderer page={dashboardPage} appId={appId} appDefinition={appDefinition} />;
  }

  // Route matching
  const matchedPage = matchPage(uiDefinition.pages, slug);

  // Special rendering for create/edit/detail pages that need record context
  if (matchedPage?.type === 'create') {
    const formComp = matchedPage.layout.children[0];
    return (
      <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{matchedPage.title}</h1>
        <DynamicForm
          config={formComp.config as any}
          appId={appId}
          appDefinition={appDefinition}
        />
      </div>
    );
  }

  if (matchedPage?.type === 'edit') {
    const formComp = matchedPage.layout.children[0];
    // The record ID is the second-to-last slug segment (e.g., /entitys/[id]/edit)
    const recordId = slug[slug.length - 2];
    return (
      <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{matchedPage.title}</h1>
        <DynamicForm
          config={formComp.config as any}
          appId={appId}
          appDefinition={appDefinition}
          recordId={recordId}
        />
      </div>
    );
  }

  if (matchedPage?.type === 'detail') {
    const detailComp = matchedPage.layout.children[0];
    const recordId = slug[slug.length - 1];
    return (
      <div className="p-6 md:p-8 max-w-screen-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{matchedPage.title}</h1>
        <DetailView
          config={detailComp.config as any}
          appId={appId}
          appDefinition={appDefinition}
          recordId={recordId}
        />
      </div>
    );
  }

  if (matchedPage) {
    return <PageRenderer page={matchedPage} appId={appId} appDefinition={appDefinition} />;
  }

  return notFound();
}
