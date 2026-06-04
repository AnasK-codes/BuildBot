"use client";

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from './SidebarRenderer';

interface RefinePanelProps {
  appId: string;
}

async function refineApp(appId: string, instruction: string) {
  const res = await fetch('/api/ai/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, instruction }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Refinement failed');
  return json;
}

async function previewRefine(appId: string, instruction: string) {
  const res = await fetch('/api/ai/refine/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, instruction }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Preview failed');
  return json;
}

export default function RefinePanel({ appId }: RefinePanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const previewMutation = useMutation({
    mutationFn: () => previewRefine(appId, instruction),
    onSuccess: (data) => {
      setPreview(data.data);
      setShowPreview(true);
    }
  });

  const applyMutation = useMutation({
    mutationFn: () => refineApp(appId, instruction),
    onSuccess: () => {
      setInstruction('');
      setPreview(null);
      setShowPreview(false);
      router.refresh();
    }
  });

  const isWorking = previewMutation.isPending || applyMutation.isPending;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl"
      >
        <Sparkles size={18} />
        <span className="font-medium text-sm">Refine App</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <span className="font-semibold text-sm">AI Refinement</span>
        </div>
        <button onClick={() => { setOpen(false); setShowPreview(false); }} className="p-1 hover:bg-white/20 rounded">
          <X size={16} />
        </button>
      </div>

      {/* Preview Panel */}
      {showPreview && preview && (
        <div className="px-5 py-4 border-b border-gray-100 max-h-64 overflow-y-auto bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Change Preview</h4>

          {preview.addedEntities?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-green-700 flex items-center gap-1 mb-1"><CheckCircle size={12} /> Added Entities</div>
              {preview.addedEntities.map((e: string) => <div key={e} className="text-sm text-gray-800 ml-4">+ {e}</div>)}
            </div>
          )}

          {preview.removedEntities?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-red-700 flex items-center gap-1 mb-1"><AlertTriangle size={12} /> Removed Entities</div>
              {preview.removedEntities.map((e: string) => <div key={e} className="text-sm text-gray-800 ml-4">- {e}</div>)}
            </div>
          )}

          {preview.addedFields?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-green-700 flex items-center gap-1 mb-1"><CheckCircle size={12} /> Added Fields</div>
              {preview.addedFields.map((f: any, i: number) => <div key={i} className="text-sm text-gray-800 ml-4">+ {f.entity}.{f.field}</div>)}
            </div>
          )}

          {preview.renamedEntities?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-medium text-blue-700 flex items-center gap-1 mb-1"><Info size={12} /> Renamed Entities</div>
              {preview.renamedEntities.map((r: any, i: number) => <div key={i} className="text-sm text-gray-800 ml-4">{r.from} → {r.to}</div>)}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{preview.safeChanges} safe</span>
            {preview.warnings > 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{preview.warnings} warnings</span>}
            {preview.breakingChanges > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">{preview.breakingChanges} breaking</span>}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4">
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          placeholder='e.g., "Add invoices linked to customers"'
          rows={2}
          disabled={isWorking}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
        />

        {/* Error states */}
        {previewMutation.isError && (
          <p className="text-xs text-red-500 mt-1">{(previewMutation.error as Error).message}</p>
        )}
        {applyMutation.isError && (
          <p className="text-xs text-red-500 mt-1">{(applyMutation.error as Error).message}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => previewMutation.mutate()}
            disabled={!instruction.trim() || isWorking}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-40"
          >
            {previewMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Preview
          </button>
          <button
            onClick={() => applyMutation.mutate()}
            disabled={!instruction.trim() || isWorking}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
