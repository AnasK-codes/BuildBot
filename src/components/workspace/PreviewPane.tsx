"use client";

import React, { useRef, useEffect } from 'react';
import { Maximize2, Monitor, Smartphone, Tablet } from 'lucide-react';

interface PreviewPaneProps {
  html: string;
}

export default function PreviewPane({ html }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // We write the HTML directly into the iframe document to avoid issues with very large srcdoc strings
  // or URL encoding limits on some browsers.
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }
  }, [html]);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-md transition-colors ${device === 'desktop' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Desktop view"
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-md transition-colors ${device === 'tablet' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Tablet view"
          >
            <Tablet size={16} />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-md transition-colors ${device === 'mobile' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Mobile view"
          >
            <Smartphone size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 px-3">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-200 flex items-center justify-center p-4">
        <div 
          className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 h-full"
          style={{ width: deviceWidths[device], maxWidth: '100%' }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-white"
            title="Preview"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
