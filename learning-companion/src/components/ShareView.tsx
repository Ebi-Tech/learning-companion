// src/components/ShareView.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Task } from '@/types/task';
import { format, subDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ShareView() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dataParam) {
      setError('No data found. Ask your child to generate a new share link.');
      setLoading(false);
      return;
    }

    try {
      const decoded = atob(dataParam);
      const parsed: Task[] = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        setTasks(parsed);
      } else {
        setError('Invalid data format.');
      }
    } catch (err) {
      setError('Failed to load shared progress. The link may be corrupted.');
    } finally {
      setLoading(false);
    }
  }, [dataParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
        <p className="text-gray-700">Loading shared progress...</p>
      </div>
    );
  }

  if (error || tasks.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <p className="text-red-600 font-medium">{error || 'No tasks to display yet.'}</p>
          <p className="text-sm text-gray-600 mt-2">
            Ask your child to add tasks and generate a new share link.
          </p>
        </div>
      </div>
    );
  }

  // === STREAK ===
  const getStreak = () => {
    const dates = tasks
      .filter(t => t.completed && t.completedAt)
      .map(t => new Date(t.completedAt!).toDateString());
    const unique = Array.from(new Set(dates)).sort().reverse();
    if (!unique.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < unique.length; i++) {
      const date = new Date(unique[i]);
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
        t.completedAt && new Date(t.completedAt).toDateString() === dateStr
      ).length;
      data.push({ day: format(date, 'EEE'), completions: count });
    }
    return data;
  })();

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-800 mb-2">
          My Learning Progress
        </h1>
        <p className="text-center text-gray-600 mb-8">Shared by your child</p>

        {/* Streak */}
        <div className="bg-linear-to-r from-orange-400 to-pink-500 rounded-xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Streak</p>
              <p className="text-4xl font-bold">{streak} {streak === 1 ? 'day' : 'days'}</p>
            </div>
            <div className="text-6xl">Fire</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-600 text-white p-5 rounded-xl text-center shadow">
            <p className="text-sm">Total Tasks</p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
          <div className="bg-green-600 text-white p-5 rounded-xl text-center shadow">
            <p className="text-sm">Completed</p>
            <p className="text-3xl font-bold">{done}</p>
          </div>
          <div className="bg-purple-600 text-white p-5 rounded-xl text-center shadow">
            <p className="text-sm">Rate</p>
            <p className="text-3xl font-bold">{rate}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <h3 className="text-lg font-medium mb-4">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="completions" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-medium mb-4">Tasks</h3>
          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border ${
                  task.completed ? 'bg-gray-50 border-gray-300' : 'bg-indigo-50 border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {task.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.type}
                    </span>
                  </div>
                  {task.completed && <span className="text-green-600 text-sm font-medium">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}