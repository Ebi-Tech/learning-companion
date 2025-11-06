'use client';

import { useState } from 'react';
import { TaskProvider } from '@/components/TaskContext';
import Login from '@/components/Login';
import TaskManager from '@/components/TaskManager';
import Dashboard from '@/components/Dashboard';
import { Home, BarChart3 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <TaskProvider currentUser={user}>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-800">
              Hi, {user.split('@')[0]}!
            </h1>
            <button
              onClick={() => setUser(null)}
              className="text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full shadow p-1 flex">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition ${
                  activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-gray-600'
                }`}
              >
                <Home size={20} /> Tasks
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-gray-600'
                }`}
              >
                <BarChart3 size={20} /> Dashboard
              </button>
            </div>
          </div>

          {activeTab === 'tasks' ? <TaskManager /> : <Dashboard />}
        </div>
      </main>
    </TaskProvider>
  );
}