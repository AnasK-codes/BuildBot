"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DetailConfig } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import { Loader2, AlertCircle, Pencil } from 'lucide-react';
import DynamicTable from './DynamicTable';

interface DetailViewProps {
  config: DetailConfig;
  appId: string;
  appDefinition: AppDefinition;
  recordId?: string;
}

async function fetchRecord(appId: string, entitySlug: string, recordId: string) {
  const res = await fetch(`/api/apps/${appId}/${entitySlug}/${recordId}`);
  if (!res.ok) throw new Error('Failed to load record');
  return res.json();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export default function DetailView({ config, appId, appDefinition, recordId }: DetailViewProps) {
  const params = useParams();
  const resolvedRecordId = recordId || (params?.id as string);

  const entity = appDefinition.entities.find(e => e.id === config.entityId);
  const entitySlug = entity?.name.toLowerCase() + 's';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['record', appId, config.entityId, resolvedRecordId],
    queryFn: () => fetchRecord(appId, entitySlug!, resolvedRecordId!),
    enabled: !!entity && !!resolvedRecordId,
  });

  const record = data?.data;
  const recordData = record?.data || {};

  if (!entity) {
    return <div className="p-4 bg-yellow-50 text-yellow-700 rounded">Entity not found: {config.entityId}</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading {entity.name}...
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className="flex items-center gap-2 p-6 text-red-600 bg-red-50 rounded-xl">
        <AlertCircle size={18} />
        <span>{(error as Error)?.message || 'Record not found'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Record Fields */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{entity.name} Details</h2>
          <Link
            href={`/apps/${appId}/${entitySlug}/${resolvedRecordId}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Pencil size={14} /> Edit
          </Link>
        </div>

        <dl className="divide-y divide-gray-100">
          {config.fields.map(fieldId => {
            const fieldDef = entity.fields.find(f => f.id === fieldId);
            if (!fieldDef) return null;
            const value = recordData[fieldId];

            return (
              <div key={fieldId} className="px-6 py-3 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500 col-span-1">{fieldDef.name}</dt>
                <dd className="text-sm text-gray-900 col-span-2">
                  {typeof value === 'boolean' ? (
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {value ? 'Yes' : 'No'}
                    </span>
                  ) : (
                    formatValue(value)
                  )}
                </dd>
              </div>
            );
          })}
          <div className="px-6 py-3 grid grid-cols-3 gap-4">
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="text-sm text-gray-900">
              {record.createdAt ? new Date(record.createdAt).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Child Entity Tables */}
      {config.childTables.map(ct => {
        const childEntity = appDefinition.entities.find(e => e.id === ct.entityId);
        if (!childEntity) return null;

        const childTableConfig = {
          entityId: ct.entityId,
          columns: childEntity.fields
            .filter(f => f.type !== 'relation' && f.type !== 'json')
            .slice(0, 4)
            .map(f => ({ fieldId: f.id, label: f.name })),
          actions: ['view', 'edit'] as any[]
        };

        return (
          <div key={ct.entityId}>
            <h3 className="text-base font-semibold text-gray-800 mb-3">{ct.label}</h3>
            <DynamicTable
              config={childTableConfig}
              appId={appId}
              appDefinition={appDefinition}
              filterField={ct.relationFieldId}
              filterValue={resolvedRecordId}
            />
          </div>
        );
      })}
    </div>
  );
}
