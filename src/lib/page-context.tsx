"use client";

import React, { createContext, useContext } from 'react';
import { AppDefinition } from '@/types/metadata.types';
import { AppUIDefinition, UIPage, UINavigation, UITheme } from '@/types/ui-metadata.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export interface PageContextValue {
  appId: string;
  appDefinition: AppDefinition;
  uiDefinition: AppUIDefinition;
  pageMetadata?: UIPage;
  navigation: UINavigation;
  theme: UITheme;
}

const Context = createContext<PageContextValue | undefined>(undefined);

export const usePageContext = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('usePageContext must be used within a PageContextProvider');
  }
  return ctx;
};

// Singleton query client for the app runtime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    }
  }
});

interface ProviderProps {
  value: PageContextValue;
  children: React.ReactNode;
}

export const PageContextProvider: React.FC<ProviderProps> = ({ value, children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    </QueryClientProvider>
  );
};
