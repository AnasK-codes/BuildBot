"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, Layout, Code2, MonitorPlay, Paintbrush, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { toast } from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { name: "Analyzing Prompt", icon: <Bot size={16} /> },
    { name: "Writing HTML Structure", icon: <Layout size={16} /> },
    { name: "Styling with CSS", icon: <Paintbrush size={16} /> },
    { name: "Adding Interactivity (JS)", icon: <Code2 size={16} /> },
    { name: "Validating Code", icon: <MonitorPlay size={16} /> }
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
        let res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: instruction })
        });
        
        // Auto-login as reviewer if unauthorized and retry once
        if (res.status === 401 || res.status === 403) {
          const loginRes = await fetch('/api/auth/reviewer', { method: 'POST' });
          if (loginRes.ok) {
            res = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: instruction })
            });
          }
        }

        if (!res.ok) throw new Error("Failed to generate project");
        
        clearInterval(interval);
        setGenerationStep(steps.length); // Mark all complete
        
        const json = await res.json();
        return json.data;
      } catch (e) {
        clearInterval(interval);
        setIsGenerating(false);
        toast.error('Generation failed. Please try again.');
        throw e;
      }
    },
    onSuccess: (data) => {
      toast.success('Project generated successfully!');
      setTimeout(() => {
        router.push(`/projects/${data.projectId}`);
      }, 1000);
    }
  });

  const handleReviewerLogin = async () => {
    const res = await fetch('/api/auth/reviewer', { method: 'POST' });
    if (res.ok) {
      // Refresh to get authenticated state
      window.location.reload();
    } else {
      toast.error('Failed to login as reviewer. Did you run the seed script?');
    }
  };

  const templates = [
    { title: "Tic Tac Toe", desc: "Classic playable game with win detection.", prompt: "Build a playable Tic Tac Toe game with win detection and a reset button." },
    { title: "Calculator", desc: "A sleek, functional web calculator.", prompt: "Create a modern, sleek calculator app with standard arithmetic operations." },
    { title: "Todo App", desc: "Add, complete, and delete tasks.", prompt: "Build a beautiful Todo app where users can add tasks, mark them complete, and delete them." },
    { title: "Stopwatch", desc: "Start, stop, and record lap times.", prompt: "Create a stopwatch app with start, stop, reset, and lap functionalities." },
    { title: "Quiz App", desc: "A simple multiple-choice quiz.", prompt: "Design a simple multiple-choice quiz app with 3 sample questions and a final score screen." },
    { title: "Memory Game", desc: "Card matching memory game.", prompt: "Build a card matching memory game with a grid of 16 cards (8 pairs) and a move counter." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-black">
          <Bot size={28} />
          <span className="text-xl font-bold text-black tracking-tight">BuildBot</span>
        </div>
        <div>
          <button 
            onClick={handleReviewerLogin}
            className="px-4 py-2 bg-white border border-black text-black hover:bg-black hover:text-white rounded-none font-medium transition-colors"
          >
            Reviewer Mode
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 pt-16">
        
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Build web apps at the speed of thought.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Describe what you want to build, and BuildBot will instantly generate the HTML, CSS, and JavaScript. No frameworks, just pure code.
          </p>
        </div>

        {/* Prompt Input Area */}
        <div className="bg-white p-2 rounded-none shadow-sm border border-black mb-16 max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="What do you want to build today? (e.g. 'A sleek calculator app')"
              className="w-full bg-white p-6 pr-32 rounded-none border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none h-32 text-black text-lg"
            />
            <div className="absolute bottom-4 right-4">
              <button
                onClick={() => prompt && generateApp.mutate(prompt)}
                disabled={isGenerating || !prompt}
                className="bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-none font-medium flex items-center gap-2 transition-all"
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
                    <div key={idx} className={`flex items-center gap-3 ${isPast ? 'text-black font-semibold' : isCurrent ? 'text-black font-medium' : 'text-gray-400'}`}>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-none ${isPast ? 'bg-black text-white' : isCurrent ? 'bg-gray-200 text-black animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                        {isPast ? <MonitorPlay size={14} /> : step.icon}
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
                  className="text-left group bg-white border border-gray-200 p-6 rounded-none hover:border-black hover:shadow-sm transition-all"
                >
                  <div className="w-12 h-12 bg-gray-50 border border-gray-200 text-black rounded-none flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
                    <Layout size={24} />
                  </div>
                  <h3 className="font-bold text-black mb-2">{template.title}</h3>
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
