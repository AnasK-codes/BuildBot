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
    <div className="flex flex-col h-full bg-white rounded-none border border-black">
      <div className="h-12 bg-white border-b border-black flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-none border transition-colors ${device === 'desktop' ? 'bg-black text-white border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
            title="Desktop view"
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-none border transition-colors ${device === 'tablet' ? 'bg-black text-white border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
            title="Tablet view"
          >
            <Tablet size={16} />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-none border transition-colors ${device === 'mobile' ? 'bg-black text-white border-black' : 'bg-white text-black border-transparent hover:border-black'}`}
            title="Mobile view"
          >
            <Smartphone size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-black">Preview</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 relative pattern-grid">
        <div 
          className="bg-white border border-black overflow-hidden transition-all duration-300 h-full"
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
