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
    <div className="flex flex-col h-full bg-white rounded-none border border-black overflow-hidden">
      <div className="px-4 py-3 border-b border-black bg-white flex items-center gap-2 shrink-0">
        <History size={18} className="text-black" />
        <h3 className="font-bold text-black">Version History</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative border-l border-black ml-3 space-y-6">
          {vList.map((v) => {
            const isCurrent = v.version === currentVersion;
            
            return (
              <div key={v.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className={`absolute -left-[8.5px] top-1 w-4 h-4 rounded-none border ${
                  isCurrent ? 'bg-black border-black ring-4 ring-gray-200' : 'bg-white border-black'
                }`} />
                
                <div className={`p-3 rounded-none border transition-all ${
                  isCurrent ? 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 border-gray-300 hover:border-black'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1">
                      <GitCommit size={12} />
                      v{v.version}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${isCurrent ? 'text-black font-bold' : 'text-gray-700'} line-clamp-2`}>
                    "{v.prompt}"
                  </p>
                  
                  {!isCurrent && (
                    <div className="mt-3">
                      <button 
                        onClick={() => rollbackMutation.mutate(v.version)}
                        disabled={rollbackMutation.isPending}
                        className="text-xs flex items-center gap-1 text-black hover:text-white font-bold bg-white hover:bg-black px-2 py-1 rounded-none border border-black transition-colors"
                      >
                        <ArrowLeftCircle size={14} />
                        Restore this version
                      </button>
                    </div>
                  )}
                  
                  {isCurrent && (
                    <div className="mt-2 text-xs flex items-center gap-1 text-black font-bold">
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
