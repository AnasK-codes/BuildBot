"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MetadataErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Metadata UI Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-red-50 text-red-900">
          <h2 className="text-2xl font-bold mb-4">Metadata Rendering Error</h2>
          <p className="mb-4">The application UI metadata contains invalid configuration or references.</p>
          <pre className="p-4 bg-white rounded overflow-auto max-w-3xl w-full border border-red-200">
            {this.state.error?.message}
          </pre>
          <button 
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded shadow"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
