// src/components/TaskManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { getTasks, saveTasks } from '@/utils/storage';
import { Plus, Trash2 } from 'lucide-react';

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'daily' | 'weekly'>('daily');

  // Load tasks on mount
  useEffect(() => {
    setTasks(getTasks());
  }, []);

  // Save whenever tasks change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      type,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setTitle('');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Tasks</h2>

      {/* Add Task Form */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="What do you need to study?"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'daily' | 'weekly')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            onClick={addTask}
            className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition flex items-center gap-1"
          >
            <Plus size={20} />
            Add
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div>
                <h3 className="font-medium text-gray-800">{task.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {task.type}
                </span>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}