// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/AuthForm';
import App from './App';
import { TaskProvider } from '@/components/TaskContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return user ? (
    <TaskProvider currentUser={user.id}>
      <App />
    </TaskProvider>
  ) : (
    <AuthForm />
  );
}