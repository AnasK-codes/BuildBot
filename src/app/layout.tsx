import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import { Toaster } from 'react-hot-toast';
import PwaRegistrar from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  title: 'BuildBot — AI App Generator',
  description: 'Generate full-stack applications from natural language prompts.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black antialiased">
        <Providers>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: '#000',
                color: '#fff',
                borderRadius: '0px',
                border: '1px solid #333',
                fontSize: '14px',
                fontWeight: 'bold',
              },
            }}
          />
          <PwaRegistrar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
