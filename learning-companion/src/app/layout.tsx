// src/app/layout.tsx
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import { ReactNode } from 'react';
import ServiceWorkerScript from './ServiceWorkerScript';

export const metadata: Metadata = {
  title: 'Learning Companion',
  description: 'Track your study habits, build streaks, share progress.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>
          <ServiceWorkerScript />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}