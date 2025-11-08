// src/components/Dashboard.tsx
'use client';

import { useTasks } from './TaskContext';
import { Flame } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { tasks } = useTasks();

  // ---------- STREAK ----------
  const calculateStreak = () => {
    const completedDates = tasks
      .filter(t => t.completed && t.completed_at)
      .map(t => format(new Date(t.completed_at!), 'yyyy-MM-dd'))
      .sort()
      .reverse();

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    let current = today;

    for (const date of completedDates) {
      if (date === current) {
        streak++;
        current = format(subDays(new Date(current), 1), 'yyyy-MM-dd');
      } else if (date < current) {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  // ---------- CHART ----------
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

  return (
    <div className="space-y-8">
      {/* Streak Card */}
      <div className="bg-linear-to-r from-orange-400 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current Streak</p>
            <p className="text-4xl font-bold mt-1">{streak} days</p>
          </div>
          <Flame size={60} className="text-white opacity-90" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
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
    </div>
  );
}