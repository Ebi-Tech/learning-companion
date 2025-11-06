// src/components/Dashboard.tsx
'use client';

import { useMemo } from 'react';
import { useTasks } from './TaskContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { tasks } = useTasks();

  // CRITICAL: Guard against undefined
  if (!Array.isArray(tasks)) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = date.toDateString();
      const count = tasks.filter(t => 
        t.completedAt && new Date(t.completedAt).toDateString() === dateStr
      ).length;

      data.push({
        day: format(date, 'EEE'),
        completions: count,
      });
    }
    return data;
  }, [tasks]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Progress Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 text-white p-5 rounded-xl text-center">
          <p className="text-sm">Total</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="bg-green-600 text-white p-5 rounded-xl text-center">
          <p className="text-sm">Done</p>
          <p className="text-3xl font-bold">{completed}</p>
        </div>
        <div className="bg-purple-600 text-white p-5 rounded-xl text-center">
          <p className="text-sm">Rate</p>
          <p className="text-3xl font-bold">{rate}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
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
    </div>
  );
}