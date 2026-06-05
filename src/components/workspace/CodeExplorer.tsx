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
    if (path.endsWith('.html')) return <FileCode size={16} />;
    if (path.endsWith('.css')) return <FileType size={16} />;
    if (path.endsWith('.js')) return <FileJson size={16} />;
    return <FileCode size={16} />;
  };

  const activeContent = files.find(f => f.path === activeFile)?.content || '';

  return (
    <div className="flex flex-col h-full bg-white rounded-none border border-black">
      <div className="flex bg-white border-b border-black shrink-0 overflow-x-auto">
        {files.map(file => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-r border-black whitespace-nowrap transition-colors ${
              activeFile === file.path 
                ? 'text-white bg-black' 
                : 'text-black hover:bg-gray-100'
            }`}
          >
            {getIcon(file.path)}
            {file.path}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-auto bg-black p-4 text-white font-mono text-sm leading-relaxed">
        <pre className="m-0">
          <code>{activeContent}</code>
        </pre>
      </div>
    </div>
  );
}
