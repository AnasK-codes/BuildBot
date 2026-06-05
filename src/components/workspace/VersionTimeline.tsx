"use client";

import React from 'react';
import { History, GitCommit, ArrowLeftCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface Version {
  id: string;
  version: number;
  prompt: string;
  status: string;
  createdAt: string;
}

interface VersionTimelineProps {
  projectId: string;
  currentVersion: number;
  onVersionChange: (version: number) => void;
}

export default function VersionTimeline({ projectId, currentVersion, onVersionChange }: VersionTimelineProps) {
  const { data: versions, isLoading, refetch } = useQuery<{data: Version[]}>({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      if (!res.ok) throw new Error('Failed to fetch versions');
      return res.json();
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: async (version: number) => {
      const res = await fetch(`/api/projects/${projectId}/versions/${version}/rollback`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to rollback');
      return res.json();
    },
    onSuccess: (data) => {
      onVersionChange(data.data.currentVersion);
      refetch();
    }
  });

  if (isLoading) {
    return <div className="p-4 text-gray-500 text-sm">Loading history...</div>;
  }

  const vList = versions?.data || [];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 shrink-0">
        <History size={18} className="text-gray-600" />
        <h3 className="font-semibold text-gray-800">Version History</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
          {vList.map((v) => {
            const isCurrent = v.version === currentVersion;
            
            return (
              <div key={v.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
                  isCurrent ? 'bg-indigo-600 border-indigo-200 ring-4 ring-indigo-50' : 'bg-white border-gray-300'
                }`} />
                
                <div className={`p-3 rounded-lg border transition-all ${
                  isCurrent ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <GitCommit size={12} />
                      v{v.version}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${isCurrent ? 'text-indigo-900 font-medium' : 'text-gray-600'} line-clamp-2`}>
                    "{v.prompt}"
                  </p>
                  
                  {!isCurrent && (
                    <div className="mt-3">
                      <button 
                        onClick={() => rollbackMutation.mutate(v.version)}
                        disabled={rollbackMutation.isPending}
                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-white px-2 py-1 rounded border border-indigo-100 hover:border-indigo-200 transition-colors"
                      >
                        <ArrowLeftCircle size={14} />
                        Restore this version
                      </button>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <div className="mt-2 text-xs flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle size={12} />
                      Current Version
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
