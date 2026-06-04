"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TableConfig } from '@/types/ui-metadata.types';
import { AppDefinition } from '@/types/metadata.types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from './SidebarRenderer';

interface DynamicTableProps {
  config: TableConfig;
  appId: string;
  appDefinition: AppDefinition;
  // optional: if embedded in a DetailView, filter by parent record
  filterField?: string;
  filterValue?: string;
}

async function fetchRecords(appId: string, entitySlug: string, cursor?: string) {
  const params = new URLSearchParams({ limit: '10' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/apps/${appId}/${entitySlug}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch records');
  return res.json();
}

async function deleteRecord(appId: string, entitySlug: string, recordId: string) {
  const res = await fetch(`/api/apps/${appId}/${entitySlug}/${recordId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete record');
  return res.json();
}

export default function DynamicTable({ config, appId, appDefinition, filterField, filterValue }: DynamicTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);

  const entity = appDefinition.entities.find(e => e.id === config.entityId);
  const entitySlug = entity?.name.toLowerCase() + 's';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['records', appId, config.entityId, cursor],
    queryFn: () => fetchRecords(appId, entitySlug!, cursor),
    enabled: !!entity
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => deleteRecord(appId, entitySlug!, recordId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['records', appId, config.entityId] })
  });

  const records: any[] = data?.data || [];
  const hasMore = data?.meta?.pagination?.hasMore ?? false;
  const nextCursor = data?.meta?.pagination?.cursor;

  const handleNextPage = () => {
    if (nextCursor) {
      const newHistory = [...cursorHistory, nextCursor];
      setCursorHistory(newHistory);
      setPageIndex(pageIndex + 1);
      setCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      const newHistory = [...cursorHistory];
      newHistory.pop();
      setCursorHistory(newHistory);
      const prevCursor = newHistory[newHistory.length - 1];
      setPageIndex(pageIndex - 1);
      setCursor(prevCursor);
    }
  };

  if (!entity) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-700 text-sm">
        Entity not found: {config.entityId}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-sm text-gray-500">{records.length} record{records.length !== 1 ? 's' : ''}</span>
        {config.actions.includes('create') && (
          <Link
            href={`/apps/${appId}/${entitySlug}/new`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            New {entity.name}
          </Link>
        )}
      </div>

      {/* State: Loading */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span>Loading {entity.name}s...</span>
        </div>
      )}

      {/* State: Error */}
      {isError && (
        <div className="flex items-center gap-2 p-6 text-red-600 bg-red-50">
          <AlertCircle size={18} />
          <span>{(error as Error)?.message || 'Failed to load records'}</span>
        </div>
      )}

      {/* State: Empty */}
      {!isLoading && !isError && records.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">🗂️</div>
          <p className="text-sm">No {entity.name}s yet.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {config.columns.map(col => (
                  <th key={col.fieldId} className="px-5 py-3 text-left font-medium">{col.label}</th>
                ))}
                {(config.actions.includes('edit') || config.actions.includes('delete')) && (
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                  {config.columns.map((col, idx) => {
                    const value = record.data?.[col.fieldId] ?? record[col.fieldId] ?? '—';
                    return (
                      <td key={col.fieldId} className="px-5 py-3 text-gray-800">
                        {idx === 0 ? (
                          <Link
                            href={`/apps/${appId}/${entitySlug}/${record.id}`}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {String(value)}
                          </Link>
                        ) : (
                          typeof value === 'boolean' ? (
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                              {value ? 'Yes' : 'No'}
                            </span>
                          ) : String(value)
                        )}
                      </td>
                    );
                  })}
                  {(config.actions.includes('edit') || config.actions.includes('delete')) && (
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {config.actions.includes('edit') && (
                          <Link href={`/apps/${appId}/${entitySlug}/${record.id}/edit`}>
                            <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                              <Pencil size={14} />
                            </button>
                          </Link>
                        )}
                        {config.actions.includes('delete') && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete this ${entity.name}?`)) deleteMutation.mutate(record.id);
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && (pageIndex > 0 || hasMore) && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <button
            onClick={handlePrevPage}
            disabled={pageIndex === 0}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span>Page {pageIndex + 1}</span>
          <button
            onClick={handleNextPage}
            disabled={!hasMore}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
