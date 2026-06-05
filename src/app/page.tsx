"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, Layout, Database, CheckCircle, ArrowRight, Server, FileJson } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const steps = [
    { name: "Analyzing Prompt", icon: <Bot size={16} /> },
    { name: "Generating Schema", icon: <Database size={16} /> },
    { name: "Generating Relationships", icon: <Server size={16} /> },
    { name: "Creating Draft", icon: <FileJson size={16} /> },
    { name: "Generating UI", icon: <Layout size={16} /> },
    { name: "Generating Sample Data", icon: <CheckCircle size={16} /> }
  ];

  const generateApp = useMutation({
    mutationFn: async (instruction: string) => {
      // Setup fake timeline
      setIsGenerating(true);
      setGenerationStep(0);
      
      const interval = setInterval(() => {
        // Cap progression at second-to-last step. Final step only completes when API returns.
        setGenerationStep(prev => Math.min(prev + 1, steps.length - 2));
      }, 3000);

      try {
        const res = await fetch('/api/ai/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instruction })
        });
        
        if (!res.ok) throw new Error("Failed to generate app");
        
        clearInterval(interval);
        setGenerationStep(steps.length); // Mark all complete
        
        const json = await res.json();
        return json.data;
      } catch (e) {
        clearInterval(interval);
        setIsGenerating(false);
        showToast('Generation failed. Please try again.', 'error');
        throw e;
      }
    },
    onSuccess: (data) => {
      setTimeout(() => {
        router.push(`/apps/${data.appId}`);
      }, 1000);
    }
  });

  const handleReviewerLogin = async () => {
    const res = await fetch('/api/auth/reviewer', { method: 'POST' });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      showToast('Failed to login as reviewer. Did you run the seed script?', 'error');
    }
  };

  const templates = [
    { title: "CRM", desc: "Customer Relationship Management with deals, pipelines, and contacts.", prompt: "Build a CRM for managing customers, tracking deal pipelines, and storing interaction history." },
    { title: "Inventory", desc: "Track stock, products, and suppliers in real time.", prompt: "Create an inventory management app with products, SKU, stock levels, and suppliers." },
    { title: "Project Management", desc: "Kanban boards, tasks, and team tracking.", prompt: "Build a project management tool with tasks, projects, status, and team assignments." },
    { title: "E-Commerce", desc: "Products, orders, and customer accounts.", prompt: "Create an e-commerce backend tracking products, customer orders, and cart items." },
    { title: "Booking", desc: "Appointments, schedules, and service management.", prompt: "Design a booking system for scheduling appointments with services and clients." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-indigo-600">
          <Bot size={28} />
          <span className="text-xl font-bold text-gray-900 tracking-tight">BuildBot</span>
        </div>
        <div>
          <button 
            onClick={handleReviewerLogin}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
          >
            Reviewer Mode
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg font-medium text-white z-50 transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 pt-16">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Build software at the speed of thought.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Describe your ideal application in natural language, and BuildBot will generate the schema, backend, UI, and sample data in seconds.
          </p>
        </div>

        {/* Prompt Input Area */}
        <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 mb-16 max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="What do you want to build today? (e.g. 'A CRM to track leads and deals')"
              className="w-full bg-gray-50 p-6 pr-32 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32 text-gray-800 text-lg"
            />
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => prompt && generateApp.mutate(prompt)}
                disabled={isGenerating || !prompt}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="animate-spin" size={18} />
                    Building...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Generate
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Generation Timeline Modal/Overlay */}
          {isGenerating && (
            <div className="mt-6 border-t border-gray-100 pt-6 px-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Generation Status</h3>
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isPast = generationStep > idx;
                  const isCurrent = generationStep === idx;
                  
                  return (
                    <div key={idx} className={`flex items-center gap-3 ${isPast ? 'text-green-600' : isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isPast ? 'bg-green-100' : isCurrent ? 'bg-indigo-100 animate-pulse' : 'bg-gray-100'}`}>
                        {isPast ? <CheckCircle size={14} /> : step.icon}
                      </div>
                      <span className="text-sm">{step.name}</span>
                      {isCurrent && <span className="ml-auto text-xs animate-pulse">In progress...</span>}
                      {isPast && <span className="ml-auto text-xs font-semibold">Done</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Template Gallery */}
        {!isGenerating && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Or start with a template</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => generateApp.mutate(template.prompt)}
                  className="text-left group bg-white border border-gray-200 p-6 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Layout size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{template.title}</h3>
                  <p className="text-sm text-gray-500">{template.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
