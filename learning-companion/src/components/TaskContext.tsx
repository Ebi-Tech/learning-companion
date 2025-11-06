// src/components/TaskContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '@/types/task';
import { getTasks, saveTasks } from '@/utils/storage';

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, type: 'daily' | 'weekly') => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  downloadBackup: () => void;
  uploadBackup: (file: File) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ 
  children, 
  currentUser 
}: { 
  children: ReactNode;
  currentUser: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]); // Always start as []

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    try {
      const loaded = getTasks(currentUser);
      setTasks(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setTasks([]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !Array.isArray(tasks)) return;
    try {
      saveTasks(currentUser, tasks);
    } catch (err) {
      console.error('Failed to save tasks:', err);
    }
  }, [tasks, currentUser]);

  const addTask = (title: string, type: 'daily' | 'weekly') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      type,
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined
        };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const downloadBackup = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-companion-${currentUser.split('@')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadBackup = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setTasks(parsed);
            resolve();
          } else {
            reject(new Error('Invalid backup: not an array'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, addTask, toggleComplete, deleteTask, 
      downloadBackup, uploadBackup 
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
};