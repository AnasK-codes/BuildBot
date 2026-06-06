"use client";

import React, { useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

interface ExportModalProps {
  projectId: string;
  onClose: () => void;
}

export default function ExportModal({ projectId, onClose }: ExportModalProps) {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('buildbot-generated-app');

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, repoName }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to export to GitHub');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Successfully exported to GitHub!');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="p-4 border-b border-black flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <UploadCloud size={20} />
            Export to GitHub
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Push this generated code to a new public GitHub repository. You will need a Personal Access Token with <code className="bg-gray-100 px-1 font-bold">repo</code> scope.
          </p>
          
          <div>
            <label className="block text-sm font-bold mb-1">Repository Name</label>
            <input 
              type="text" 
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="e.g. my-awesome-app"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Personal Access Token</label>
            <input 
              type="password" 
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full border border-black p-2 focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-black bg-gray-50 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-black font-bold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => exportMutation.mutate()}
            disabled={!token || !repoName || exportMutation.isPending}
            className="px-4 py-2 bg-black text-white font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {exportMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
