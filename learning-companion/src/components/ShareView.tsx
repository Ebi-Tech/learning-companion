// src/components/ShareView.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/types/task';
import { format, subDays, startOfDay } from 'date-fns';
import { Flame, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ShareView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // === FETCH + REALTIME ===
  useEffect(() => {
    let channel: any = null;

    const setup = async () => {
      try {
        // 1. Get public share token from URL (optional)
        const url = new URL(window.location.href);
        const token = url.searchParams.get('token');

        if (!token) {
          setError('Invalid share link. Ask your child to generate a new one.');
          setLoading(false);
          return;
        }

        // 2. Get user_id from token (you'll need a function table or JWT)
        // For now, assume token = user_id (set in Dashboard)
        const userId = token;

        // 3. Load initial tasks
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (!data) throw new Error('No tasks found');

        setTasks(data);
        setLoading(false);

        // 4. Realtime
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
                setTasks(prev =>
                  prev.map(t => (t.id === newTask.id ? newTask : t))
                );
              }
              if (payload.eventType === 'DELETE') {
                setTasks(prev => prev.filter(t => t.id !== oldId));
              }
            }
          )
          .subscribe();
      } catch (err: any) {
        setError(err.message || 'Failed to load progress');
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // === STREAK ===
  const getStreak = () => {
    const dates = tasks
      .filter(t => t.completed && t.completed_at)
      .map(t => new Date(t.completed_at!).toDateString())
      .sort()
      .reverse();

    if (!dates.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      date.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (date.getTime() === expected.getTime()) streak++;
      else break;
    }
    return streak;
  };

  const streak = getStreak();

  // === CHART ===
  const chartData = (() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = date.toDateString();
      const count = tasks.filter(t =>
        t.completed_at && new Date(t.completed_at).toDateString() === dateStr
      ).length;
      data.push({ day: format(date, 'EEE'), completions: count });
    }
    return data;
  })();

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
        <p className="text-gray-700 text-lg">Loading your child's progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-sm text-gray-600 mt-3">
            Ask your child to generate a new share link from the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-2">
          My Learning Progress
        </h1>
        <p className="text-center text-gray-600 mb-10">Live view • Updates in real-time</p>

        {/* Streak */}
        <div className="bg-linear-to-r from-orange-400 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Streak</p>
              <p className="text-5xl font-bold">{streak} {streak === 1 ? 'day' : 'days'}</p>
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
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fill: '#666' }} />
              <YAxis tick={{ fill: '#666' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                stroke="#8b5cf6"
                strokeWidth={4}
                dot={{ fill: '#8b5cf6', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Gallery */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">All Tasks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`rounded-xl p-5 border-2 transition-all ${
                  task.completed
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-indigo-50 border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    task.type === 'daily'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {task.type.toUpperCase()}
                  </span>
                  {task.completed && <CheckCircle2 className="text-green-600" size={20} />}
                </div>

                <h4 className={`font-semibold text-lg mb-3 ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                }`}>
                  {task.title}
                </h4>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{format(new Date(task.created_at!), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{format(new Date(task.created_at!), 'h:mm a')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}