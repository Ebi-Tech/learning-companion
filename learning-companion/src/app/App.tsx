// src/app/App.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import TaskManager from '@/components/TaskManager';
import Dashboard from '@/components/Dashboard';
import { useState } from 'react';


export default function App() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks');

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-800">
            Hi, {user?.email?.split('@')[0]}!
          </h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-red-600 hover:underline"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="max-w-4xl mx-auto px-6 mt-6">
        <div className="flex bg-white rounded-full shadow-md p-1">
          {[
            { id: 'tasks', label: 'Tasks' },
            { id: 'dashboard', label: 'Dashboard' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-3 px-6 rounded-full font-medium transition ${
                activeTab === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'tasks' ? <TaskManager /> : <Dashboard />}
      </main>
      
    </div>
  );
}