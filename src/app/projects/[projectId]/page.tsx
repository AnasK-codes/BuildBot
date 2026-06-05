"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bot, ArrowLeft, Loader2, Code2, Play } from 'lucide-react';
import PreviewPane from '@/components/workspace/PreviewPane';
import CodeExplorer from '@/components/workspace/CodeExplorer';
import ChatPanel from '@/components/workspace/ChatPanel';
import VersionTimeline from '@/components/workspace/VersionTimeline';

interface ProjectData {
  id: string;
  title: string;
  status: string;
  currentVersion: number;
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  previewHtml: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load project');
      }
      const data = await res.json();
      setProject(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleVersionChange = (newVersion: number) => {
    fetchProject(); // Re-fetch to get new version data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center max-w-md">
          <h2 className="text-lg font-bold mb-2">Error Loading Project</h2>
          <p className="mb-4">{error || 'Project not found'}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white text-red-600 font-medium rounded-lg shadow-sm border border-red-200 hover:bg-red-50 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Back to home"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-indigo-600 border-l border-gray-200 pl-4">
            <Bot size={22} />
            <span className="font-bold text-gray-900 tracking-tight text-lg truncate max-w-[200px]">
              {project.title}
            </span>
          </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Play size={16} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'code' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code2 size={16} />
            Code
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
            v{project.currentVersion}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* Left Panel: Preview or Code */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {activeTab === 'preview' ? (
            <PreviewPane html={project.previewHtml} />
          ) : (
            <CodeExplorer files={project.files} />
          )}
        </div>

        {/* Right Panel: Chat & History */}
        <div className="w-96 shrink-0 flex flex-col gap-4 h-full">
          {/* Chat (Top 2/3) */}
          <div className="flex-[2] min-h-0">
            <ChatPanel 
              projectId={project.id} 
              currentVersion={project.currentVersion} 
              onRefined={handleVersionChange} 
            />
          </div>
          
          {/* Timeline (Bottom 1/3) */}
          <div className="flex-[1] min-h-0">
            <VersionTimeline 
              projectId={project.id} 
              currentVersion={project.currentVersion} 
              onVersionChange={handleVersionChange} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
