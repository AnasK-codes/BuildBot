"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, Sparkles, Layout, Code2, MonitorPlay, Paintbrush, ArrowRight,
  Zap, MessageSquare, Smartphone, Download, History
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const steps = [
    { name: "Analyzing Prompt", icon: <Bot size={16} /> },
    { name: "Writing HTML Structure", icon: <Layout size={16} /> },
    { name: "Styling with CSS", icon: <Paintbrush size={16} /> },
    { name: "Adding Interactivity (JS)", icon: <Code2 size={16} /> },
    { name: "Validating Code", icon: <MonitorPlay size={16} /> }
  ];

  const generateApp = useMutation({
    mutationFn: async (instruction: string) => {
      setIsGenerating(true);
      setGenerationStep(0);
      
      const interval = setInterval(() => {
        setGenerationStep(prev => Math.min(prev + 1, steps.length - 2));
      }, 3000);

      try {
        let res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: instruction })
        });
        
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
        setGenerationStep(steps.length); 
        
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

  const features = [
    { title: "Instant Generation", desc: "AI writes raw HTML, CSS, and vanilla JS in seconds. Zero framework overhead. Clean, portable, and blazing fast.", icon: <Zap size={24} /> },
    { title: "Chat & Refine", desc: "Don't like the color? Want to add a button? Just chat with the AI to refine your app block by block.", icon: <MessageSquare size={24} /> },
    { title: "Responsive Previews", desc: "Built-in device emulators let you test your app on desktop, tablet, and mobile instantly without leaving the workspace.", icon: <Smartphone size={24} /> },
    { title: "Version History", desc: "Every refinement creates a new snapshot. Instantly travel back in time to any previous version with a single click.", icon: <History size={24} /> },
    { title: "Instant Export", desc: "Download your raw code as a zip file containing index.html, style.css, and script.js. Host it anywhere instantly.", icon: <Download size={24} /> },
    { title: "No Dependencies", desc: "What you see is what you get. You own the code forever, and it runs everywhere without needing node_modules.", icon: <Code2 size={24} /> }
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b-2 border-black sticky top-0 z-50">
        <div className="flex items-center gap-2 text-black cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <Bot size={28} />
          <span className="text-xl font-bold text-black tracking-tight">BuildBot</span>
        </div>
        <div>
          <button 
            onClick={handleReviewerLogin}
            className="px-4 py-2 bg-white border-2 border-black text-black hover:bg-black hover:text-white rounded-none font-bold transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 hover:translate-x-1"
          >
            Reviewer Mode
          </button>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        
        {/* Hero Section */}
        <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
          <div className="inline-block px-4 py-1.5 border-2 border-black font-bold text-sm uppercase tracking-wider mb-8 bg-[#f4f4f5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            v2.0: Now Generating Raw Code
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-black tracking-tighter leading-tight mb-6">
            Build web apps at <br/> the <span className="bg-black text-white px-4 py-1 inline-block transform -skew-x-3">speed of thought.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-12 font-medium">
            Describe what you want to build, and BuildBot instantly generates the HTML, CSS, and JavaScript. No frameworks, just pure code.
          </p>

          {/* Prompt Input Area */}
          <div className="w-full max-w-3xl relative">
            <div className="bg-white p-2 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform focus-within:translate-y-1 focus-within:translate-x-1 focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="What do you want to build today? (e.g. 'A sleek calculator app')"
                className="w-full bg-white p-4 pr-32 focus:outline-none resize-none h-32 text-black text-lg md:text-xl font-medium placeholder-gray-400"
              />
              <div className="absolute bottom-6 right-6">
                <button
                  onClick={() => prompt && generateApp.mutate(prompt)}
                  disabled={isGenerating || !prompt}
                  className="bg-black text-white px-6 py-3 font-bold flex items-center gap-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 transition-colors border-2 border-transparent"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="animate-spin" size={18} />
                      Building...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 uppercase tracking-wide">
                      Generate
                      <ArrowRight size={18} />
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Generation Timeline Modal/Overlay */}
            {isGenerating && (
              <div className="absolute top-[120%] left-0 right-0 bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 text-left">
                <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4 border-b-2 border-black pb-2">Build Pipeline Running</h3>
                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const isPast = generationStep > idx;
                    const isCurrent = generationStep === idx;
                    
                    return (
                      <div key={idx} className={`flex items-center gap-3 ${isPast ? 'text-black' : isCurrent ? 'text-black' : 'text-gray-300'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center border-2 ${isPast ? 'bg-black text-white border-black' : isCurrent ? 'bg-gray-100 text-black border-black animate-pulse' : 'bg-white text-gray-300 border-gray-300'}`}>
                          {isPast ? <MonitorPlay size={16} /> : step.icon}
                        </div>
                        <span className={`font-bold ${isCurrent ? 'animate-pulse' : ''}`}>{step.name}</span>
                        {isCurrent && <span className="ml-auto text-xs uppercase font-bold tracking-widest animate-pulse">Running</span>}
                        {isPast && <span className="ml-auto text-xs uppercase font-bold tracking-widest bg-black text-white px-2 py-0.5">Done</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full bg-black text-white py-24 border-y-2 border-black">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-black mb-16 text-center uppercase tracking-tight">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white text-black border-4 border-white p-8 hover:scale-105 transition-transform">
                <div className="text-5xl font-black text-gray-200 mb-4">01</div>
                <h3 className="text-2xl font-bold mb-4 uppercase">Describe</h3>
                <p className="font-medium text-gray-600">Type a simple prompt detailing the app, layout, and functionality you envision. The more detail, the better.</p>
              </div>
              <div className="bg-white text-black border-4 border-white p-8 hover:scale-105 transition-transform">
                <div className="text-5xl font-black text-gray-200 mb-4">02</div>
                <h3 className="text-2xl font-bold mb-4 uppercase">Generate</h3>
                <p className="font-medium text-gray-600">BuildBot's AI engine instantly provisions the semantic HTML, styles it with custom CSS, and wires up JavaScript logic.</p>
              </div>
              <div className="bg-white text-black border-4 border-white p-8 hover:scale-105 transition-transform">
                <div className="text-5xl font-black text-gray-200 mb-4">03</div>
                <h3 className="text-2xl font-bold mb-4 uppercase">Iterate</h3>
                <p className="font-medium text-gray-600">Jump into the visual workspace. Use conversational chat to refine the UI, roll back versions, and export raw files.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-24 bg-[#f4f4f5]">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-16 text-center uppercase tracking-tight">Everything You Need</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat, idx) => (
                <div key={idx} className="bg-white border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center mb-6 border-2 border-black">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-black mb-3 uppercase">{feat.title}</h3>
                  <p className="text-gray-700 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates Gallery */}
        <section className="w-full py-24 bg-white border-t-2 border-black">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl md:text-5xl font-black text-black mb-4 text-center uppercase tracking-tight">Zero to One in Seconds</h2>
            <p className="text-xl text-gray-600 text-center font-medium mb-16 max-w-2xl mx-auto">Click any of the templates below to instantly generate a working application and start exploring the workspace.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => generateApp.mutate(template.prompt)}
                  disabled={isGenerating}
                  className="text-left group bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors disabled:opacity-50 flex flex-col h-full"
                >
                  <div className="w-12 h-12 bg-white border-2 border-black text-black flex items-center justify-center mb-4 group-hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-shadow">
                    <Layout size={24} />
                  </div>
                  <h3 className="font-bold text-xl mb-2 uppercase">{template.title}</h3>
                  <p className="text-sm font-medium opacity-80 group-hover:text-gray-300 flex-1">{template.desc}</p>
                  
                  <div className="mt-6 flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                    Generate Template <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-32 bg-[#fff44f] border-t-2 border-black flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-5xl md:text-7xl font-black text-black mb-8 uppercase tracking-tighter">Ready to Build?</h2>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-4 bg-black text-white font-black text-xl uppercase tracking-widest border-4 border-black hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-2 hover:translate-x-2"
          >
            Start For Free
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t-2 border-black py-8 px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
          © {new Date().getFullYear()} BuildBot. Built with pure code.
        </p>
      </footer>
    </div>
  );
}
