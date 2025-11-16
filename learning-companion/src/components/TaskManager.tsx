// src/components/TaskManager.tsx
'use client';

import { useTasks } from './TaskContext';
import { Plus, Trash2, Circle, CheckCircle2, Calendar, Clock, Download, Upload, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';

export default function TaskManager() {
  const { tasks, addTask, toggleComplete, deleteTask, downloadBackup, uploadBackup } = useTasks();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'daily' | 'weekly'>('daily');
  const [generatingShare, setGeneratingShare] = useState(false);

  const handleAdd = () => {
    if (title.trim()) {
      addTask(title, type);
      setTitle('');
    }
  };

  const handleShare = async () => {
    if (!user) {
      alert('Please sign in to generate share links');
      return;
    }

    setGeneratingShare(true);
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get user session');
      }

      if (!session) {
        alert('Please sign in to generate share links');
        return;
      }

      console.log('🔄 Generating share token for user:', user.id);
      console.log('Access token:', session.access_token.substring(0, 20) + '...');

      // Call the API with access token as query parameter
      const apiUrl = `/api/generate-share-token?access_token=${encodeURIComponent(session.access_token)}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to generate share link: ${response.status}`);
      }

      const { shareUrl, message } = await response.json();
      console.log('✅ Share URL generated:', shareUrl);
      
      await navigator.clipboard.writeText(shareUrl);
      alert(message || 'Share link copied to clipboard! Expires in 30 days.');
      
    } catch (error: any) {
      console.error('❌ Error generating share link:', error);
      alert(error.message || 'Failed to generate share link. Please try again.');
    } finally {
      setGeneratingShare(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadBackup(file);
  };

  return (
    <div className="space-y-6">
      {/* ---------- ACTION BUTTONS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={downloadBackup}
          className="bg-green-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
        >
          <Download size={20} /> Download Backup
        </button>

        <label className="bg-blue-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer">
          <Upload size={20} /> Restore Backup
          <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </label>

        <button
          onClick={handleShare}
          disabled={generatingShare}
          className="bg-purple-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingShare ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Share2 size={20} /> Share Progress
            </>
          )}
        </button>
      </div>

      {/* ---------- ADD TASK INPUT ---------- */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What do you need to study?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 placeholder-gray-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'daily' | 'weekly')}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none text-gray-700"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      </div>

      {/* ---------- TASK GALLERY ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No tasks yet. Add one to start your streak!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-5 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  {task.type}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Title */}
              <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                {task.title}
              </h3>

              {/* Timestamp */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{format(new Date(task.created_at!), 'MMM d')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{format(new Date(task.created_at!), 'h:mm a')}</span>
                </div>
              </div>

              {/* Complete */}
              <button
                onClick={() => toggleComplete(task.id)}
                className="flex items-center gap-2 text-sm font-medium transition mt-auto"
              >
                {task.completed ? (
                  <>
                    <CheckCircle2 className="text-green-600" size={22} />
                    <span className="text-green-600 font-semibold">Done</span>
                  </>
                ) : (
                  <>
                    <Circle className="text-gray-400" size={22} />
                    <span className="text-gray-600">Mark Done</span>
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}