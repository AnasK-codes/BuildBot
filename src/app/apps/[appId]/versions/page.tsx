"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { GitCommit, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function VersionHistoryPage({ params }: { params: Promise<{ appId: string }> }) {
  const resolvedParams = React.use(params);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['versions', resolvedParams.appId],
    queryFn: async () => {
      const res = await fetch(`/api/apps/${resolvedParams.appId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      const json = await res.json();
      return json.data;
    }
  });

  if (isLoading) return <div className="p-8 animate-pulse flex flex-col gap-4">
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    <div className="h-32 bg-gray-100 rounded w-full"></div>
    <div className="h-32 bg-gray-100 rounded w-full"></div>
  </div>;

  if (error || !data) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <GitCommit className="text-indigo-600" />
          Version History
        </h1>
        <p className="text-gray-500 mt-2">Track changes and AI refinements to your application.</p>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {data.history?.map((historyItem: any, index: number) => {
          const isLatest = index === 0;
          const summary = historyItem.changeSummary;
          const description = summary?.description || "AI Refinement";
          
          return (
            <div key={historyItem.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="text-sm font-bold">v{historyItem.version}</span>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{isLatest ? 'Current Version' : `Version ${historyItem.version}`}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                    <Clock size={12} />
                    {format(new Date(historyItem.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{description}</p>
                
                {summary && summary.safeChanges && summary.safeChanges.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Schema Changes</h4>
                    
                    {summary.safeChanges.filter((c:any) => c.type === 'ENTITY_ADDED').map((c:any, i:number) => (
                      <div key={`ea-${i}`} className="text-xs flex items-start gap-1.5 text-green-700">
                        <CheckCircle size={14} className="mt-0.5 shrink-0" />
                        <span>Added entity <b>{c.entityName}</b></span>
                      </div>
                    ))}
                    
                    {summary.safeChanges.filter((c:any) => c.type === 'FIELD_ADDED').map((c:any, i:number) => (
                      <div key={`fa-${i}`} className="text-xs flex items-start gap-1.5 text-green-700">
                        <CheckCircle size={14} className="mt-0.5 shrink-0" />
                        <span>Added field <b>{c.fieldName}</b> to {c.entityName}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {summary && summary.warningChanges && summary.warningChanges.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {summary.warningChanges.map((c:any, i:number) => (
                      <div key={`w-${i}`} className="text-xs flex items-start gap-1.5 text-yellow-700">
                        <Info size={14} className="mt-0.5 shrink-0" />
                        <span>{c.details}</span>
                      </div>
                    ))}
                  </div>
                )}

                {summary && summary.breakingChanges && summary.breakingChanges.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-red-50 pt-2 bg-red-50/50 p-2 rounded">
                    {summary.breakingChanges.map((c:any, i:number) => (
                      <div key={`b-${i}`} className="text-xs flex items-start gap-1.5 text-red-700">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <span>{c.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
