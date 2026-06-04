"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { WidgetConfig } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';

// ─── Shared Fetcher ─────────────────────────────────────────────────────────

async function fetchRecords(appId: string, entitySlug: string, limit = 100) {
  const res = await fetch(`/api/apps/${appId}/${entitySlug}?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

// ─── MetricWidget ────────────────────────────────────────────────────────────

interface MetricWidgetProps {
  config: WidgetConfig;
  appId: string;
}

export function MetricWidget({ config, appId }: MetricWidgetProps) {
  // We'll use appDefinition via the config's entityId, but we need the slug.
  // entityId is stored in config. We resolve the slug via name convention.
  // This component relies on a shared query + count.
  const entityId = config.entityId || '';

  // We fetch to count records – a lightweight page 1 request
  const { data, isLoading, isError } = useQuery({
    queryKey: ['metric', appId, entityId],
    queryFn: async () => {
      // The slug is derived from entityId pattern (ent_company → companys)
      // We store the entity name embedded in title e.g. "Total Companys"
      // Better: we encode the slug in the widget config title for resilience.
      // For now, resolve from entityId: ent_company → company → companys
      const entityName = entityId.replace('ent_', '');
      const slug = `${entityName}s`;
      return fetchRecords(appId, slug, 1);
    },
    enabled: !!entityId
  });

  const total = data?.meta?.pagination?.total ?? data?.data?.length ?? '—';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 truncate">{config.title}</span>
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-indigo-600" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        {isLoading ? (
          <Loader2 size={20} className="animate-spin text-gray-400" />
        ) : isError ? (
          <span className="text-sm text-red-400">Error</span>
        ) : (
          <span className="text-3xl font-bold text-gray-900">{total}</span>
        )}
      </div>
    </div>
  );
}

// ─── RecentRecordsWidget ─────────────────────────────────────────────────────

interface RecentRecordsWidgetProps {
  config: WidgetConfig;
  appId: string;
  appDefinition: AppDefinition;
}

export function RecentRecordsWidget({ config, appId, appDefinition }: RecentRecordsWidgetProps) {
  const entity = appDefinition.entities.find(e => e.id === config.entityId);
  const entitySlug = entity?.name.toLowerCase() + 's';
  const limit = config.limit ?? 5;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['recent', appId, config.entityId],
    queryFn: () => fetchRecords(appId, entitySlug!, limit),
    enabled: !!entity
  });

  const records: any[] = data?.data || [];

  // Pick the best label field (first string field)
  const labelField = entity?.fields.find(f => f.type === 'string' || f.type === 'text');
  const getLabel = (record: any) =>
    labelField ? record.data?.[labelField.id] || record.id : record.id;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden col-span-1 sm:col-span-2 xl:col-span-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{config.title}</h3>
        {entity && (
          <Link
            href={`/apps/${appId}/${entitySlug}`}
            className="text-xs text-indigo-600 hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading...
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 p-4 text-red-600 text-sm">
          <AlertCircle size={16} />
          {(error as Error)?.message}
        </div>
      )}

      {!isLoading && !isError && records.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">No records yet.</div>
      )}

      {!isLoading && !isError && records.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {records.slice(0, limit).map((record: any) => (
            <li key={record.id}>
              <Link
                href={`/apps/${appId}/${entitySlug}/${record.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 truncate">{getLabel(record)}</span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
