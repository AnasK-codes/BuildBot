"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const authMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        // Zod validation errors or generic errors
        if (json.error?.details?.errors) {
          throw new Error(json.error.details.errors[0].message);
        }
        throw new Error(json.error?.message || 'Authentication failed');
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      // Invalidate /api/me query so the homepage reflects the new user
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields');
      return;
    }
    authMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b-2 border-black">
        <div className="flex items-center gap-2 text-black cursor-pointer" onClick={() => router.push('/')}>
          <Bot size={28} />
          <span className="text-xl font-bold text-black tracking-tight">BuildBot</span>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:underline"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join BuildBot'}
          </h1>
          <p className="text-gray-600 font-medium mb-8">
            {isLogin 
              ? 'Log in to access and manage your generated projects.' 
              : 'Create an account to start saving your AI-generated apps forever.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={authMutation.isPending}
                  className="w-full border-2 border-black p-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authMutation.isPending}
                className="w-full border-2 border-black p-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authMutation.isPending}
                className="w-full border-2 border-black p-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authMutation.isPending}
              className="w-full bg-black text-white p-4 font-black uppercase tracking-widest text-lg flex items-center justify-center gap-2 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {authMutation.isPending ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t-2 border-gray-200 pt-6">
            <p className="text-gray-600 font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 font-bold text-black uppercase tracking-wider hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
