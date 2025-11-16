// src/components/ShareView.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/types/task';
import { format, subDays, startOfDay } from 'date-fns';
import { Flame, Calendar, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { verifyShareToken } from '@/lib/share-token';

export default function ShareView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  useEffect(() => {
    const initializeShareView = async () => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token');
      
      if (!token) {
        setError('Invalid share link. Missing token parameter.');
        setLoading(false);
        return;
      }

      // Verify the JWT token
      const verified = await verifyShareToken(token);
      
      if (!verified) {
        setError('Invalid or expired share link. Please request a new one.');
        setLoading(false);
        return;
      }

      const userId = verified.userId;
      let channel: any = null;

      try {
        setLoading(true);
        setError('');

        // 1. Load initial tasks
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw new Error(`Failed to load tasks: ${fetchError.message}`);
        }
        
        setTasks(data || []);

        // 2. Setup real-time subscription
        channel = supabase
          .channel(`share:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const newTask = payload.new as Task;
              const oldId = (payload.old as { id: string })?.id;

              if (payload.eventType === 'INSERT') {
                setTasks(prev => [newTask, ...prev]);
              }
              if (payload.eventType === 'UPDATE') {
                setTasks(prev => prev.map(t => (t.id === newTask.id ? newTask : t)));
              }
              if (payload.eventType === 'DELETE') {
                setTasks(prev => prev.filter(t => t.id !== oldId));
              }
            }
          )
          .subscribe((status) => {
            setSubscriptionActive(status === 'SUBSCRIBED');
          });

      } catch (err: any) {
        console.error('Setup error:', err);
        setError(err.message || 'Failed to load progress');
      } finally {
        setLoading(false);
      }

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    };

    initializeShareView();
  }, []);

  const getStreak = () => {
    if (tasks.length === 0) return 0;
    const completedDates = Array.from(
      new Set(
        tasks
          .filter(t => t.completed && t.completed_at)
          .map(t => startOfDay(new Date(t.completed_at!)).getTime())
      )
    ).sort((a, b) => b - a);
    if (completedDates.length === 0) return 0;
    let streak = 0;
    const today = startOfDay(new Date());
    let currentDate = today.getTime();
    if (completedDates.includes(currentDate)) {
      streak = 1;
      currentDate = startOfDay(subDays(new Date(currentDate), 1)).getTime();
    } else {
      const yesterday = startOfDay(subDays(today, 1)).getTime();
      if (completedDates.includes(yesterday)) {
        streak = 1;
        currentDate = startOfDay(subDays(new Date(yesterday), 1)).getTime();
      } else {
        return 0;
      }
    }
    for (let i = 0; i < completedDates.length; i++) {
      if (completedDates.includes(currentDate)) {
        streak++;
        currentDate = startOfDay(subDays(new Date(currentDate), 1)).getTime();
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = getStreak();
  const chartData = (() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = date.getTime();
      const count = tasks.filter(t =>
        t.completed_at && startOfDay(new Date(t.completed_at)).getTime() === dateStr
      ).length;
      data.push({ 
        day: format(date, 'EEE'), 
        completions: count,
        fullDate: format(date, 'MMM dd')
      });
    }
    return data;
  })();

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-indigo-600" size={32} />
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <ShieldAlert size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Progress</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            This share link may have expired or is invalid. Please request a new one.
          </p>
          <button
            onClick={handleRetry}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">
            Learning Progress
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-600">
              {subscriptionActive ? 'Live • Updates in real-time' : 'Static View • Auto-refreshing'}
            </p>
            {!subscriptionActive && <RefreshCw size={16} className="animate-spin text-gray-500" />}
          </div>
        </div>

        {/* Streak */}
        <div className="bg-linear-to-r from-orange-400 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Streak</p>
              <p className="text-5xl font-bold">{streak} day{streak !== 1 ? 's' : ''}</p>
              <p className="text-sm opacity-90 mt-2">
                {tasks.filter(t => t.completed).length} tasks completed
              </p>
            </div>
            <Flame size={70} className="text-white opacity-90" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-blue-600 text-white p-6 rounded-2xl text-center shadow-lg">
            <p className="text-sm opacity-90">Total Tasks</p>
            <p className="text-4xl font-bold">{total}</p>
          </div>
          <div className="bg-green-600 text-white p-6 rounded-2xl text-center shadow-lg">
            <p className="text-sm opacity-90">Completed</p>
            <p className="text-4xl font-bold">{done}</p>
          </div>
          <div className="bg-purple-600 text-white p-6 rounded-2xl text-center shadow-lg">
            <p className="text-sm opacity-90">Completion Rate</p>
            <p className="text-4xl font-bold">{rate}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-10">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Task Completions - Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [`${value} tasks`, 'Completed']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullDate;
                  }
                  return label;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completions" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#7c3aed' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">All Tasks</h3>
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No tasks found for this user.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tasks.map(task => (
                <div key={task.id} className="bg-white rounded-xl p-5 shadow border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      task.type === 'daily' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {task.type}
                    </span>
                    {task.completed ? (
                      <CheckCircle2 className="text-green-600 shrink-0" size={18} />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded shrink-0" />
                    )}
                  </div>
                  <h4 className={`font-semibold mb-3 ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={12} />
                    <span>
                      {task.completed && task.completed_at
                        ? `Completed: ${format(new Date(task.completed_at), 'MMM d, h:mm a')}`
                        : `Created: ${format(new Date(task.created_at!), 'MMM d, h:mm a')}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}