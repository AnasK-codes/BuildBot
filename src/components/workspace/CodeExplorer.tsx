"use client";

import React, { useState } from 'react';
import { FileCode, FileType, FileJson } from 'lucide-react';

interface CodeExplorerProps {
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
}

export default function CodeExplorer({ files }: CodeExplorerProps) {
  const [activeFile, setActiveFile] = useState<string>(files[0]?.path || 'index.html');

  const getIcon = (path: string) => {
    if (path.endsWith('.html')) return <FileCode size={16} className="text-orange-500" />;
    if (path.endsWith('.css')) return <FileType size={16} className="text-blue-500" />;
    if (path.endsWith('.js')) return <FileJson size={16} className="text-yellow-500" />;
    return <FileCode size={16} />;
  };

  const activeContent = files.find(f => f.path === activeFile)?.content || '';

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex bg-gray-50 border-b border-gray-200 shrink-0 overflow-x-auto">
        {files.map(file => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeFile === file.path 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {getIcon(file.path)}
            {file.path}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 text-gray-300 font-mono text-sm leading-relaxed">
        <pre className="m-0">
          <code>{activeContent}</code>
        </pre>
      </div>
    </div>
  );
}
