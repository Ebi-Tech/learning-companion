// src/components/TaskContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '@/types/task';
import { supabase } from '@/lib/supabaseClient';

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, type: 'daily' | 'weekly') => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
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
  const [tasks, setTasks] = useState<Task[]>([]);

  // LOAD + REALTIME SYNC
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Initial load error:', error);
        return;
      }
      setTasks(data || []);
    };

    fetchTasks();

    const channel = supabase
      .channel(`tasks:user:${currentUser}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${currentUser}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(t => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          }
          if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const addTask = async (title: string, type: 'daily' | 'weekly') => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: currentUser,
        title: trimmedTitle,
        type,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Add task error:', error);
      alert('Failed to add task');
      return;
    }

    // Realtime will add it — no need to setTasks
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const completed = !task.completed;
    const completed_at = completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at })
      .eq('id', id);

    if (error) console.error('Toggle error:', error);
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) console.error('Delete error:', error);
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
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsed: Task[] = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('Invalid backup');

          const { error } = await supabase
            .from('tasks')
            .upsert(
              parsed.map(task => ({
                ...task,
                user_id: currentUser,
              })),
              { onConflict: 'id' }
            );

          if (error) throw error;
          resolve();
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      toggleComplete, 
      deleteTask, 
      downloadBackup, 
      uploadBackup 
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