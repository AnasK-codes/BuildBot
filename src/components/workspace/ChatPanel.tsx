"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  version?: number;
}

interface ChatPanelProps {
  projectId: string;
  currentVersion: number;
  onRefined: (newVersion: number) => void;
}

export default function ChatPanel({ projectId, currentVersion, onRefined }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'I generated version 1. What would you like to change or improve?',
      version: 1
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const refineMutation = useMutation({
    mutationFn: async (instruction: string) => {
      const res = await fetch(`/api/projects/${projectId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to refine code');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      const v = data.data.version;
      setMessages(prev => [
        ...prev,
        { id: `sys-${v}`, role: 'assistant', content: `Done! Version ${v} is ready.`, version: v }
      ]);
      onRefined(v);
    },
    onError: (error: Error) => {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: `Error: ${error.message}` }
      ]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || refineMutation.isPending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: `usr-${Date.now()}`, role: 'user', content: userMsg }]);
    
    refineMutation.mutate(userMsg);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-none border border-black overflow-hidden">
      <div className="px-4 py-3 border-b border-black bg-white flex items-center gap-2">
        <Sparkles size={18} className="text-black" />
        <h3 className="font-semibold text-black">AI Chat & Refine</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-none border border-black bg-white text-black flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-none px-4 py-2 text-sm ${
              msg.role === 'user' 
                ? 'bg-black text-white' 
                : 'bg-white border border-black text-black'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.version && (
                <div className="mt-2 text-xs font-bold text-black bg-gray-100 border border-black inline-block px-2 py-0.5 rounded-none">
                  v{msg.version}
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-none border border-black bg-black text-white flex items-center justify-center shrink-0">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        
        {refineMutation.isPending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-none border border-black bg-white text-black flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-black rounded-none px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-black rounded-none animate-pulse"></div>
                <div className="w-2 h-2 bg-black rounded-none animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-black rounded-none animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-black font-bold ml-2 uppercase">Applying changes...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-black">
        {refineMutation.isError && (
          <div className="mb-2 px-3 py-2 bg-white border border-black text-black text-xs flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span className="font-bold">Error: Refinement failed. Try rewording.</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={refineMutation.isPending}
            placeholder="E.g. Make the background dark..."
            className="w-full bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black rounded-none pl-4 pr-12 py-3 text-sm transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || refineMutation.isPending}
            className="absolute right-2 top-2 bottom-2 p-1.5 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-none transition-colors flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
