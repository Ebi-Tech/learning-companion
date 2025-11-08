// src/app/layout.tsx
import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'
import { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Learning Companion',
  description: 'Track your study habits',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}