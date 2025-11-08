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

  // LOAD + REALTIME SYNC (OPTIMIZED)
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    let isMounted = true;
    let channel: any = null;

    const setupRealtime = async () => {
      // 1. Load initial tasks
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', currentUser)
        .order('created_at', { ascending: false });

      if (!isMounted) return;
      if (error) {
        console.error('Failed to load tasks:', error);
        return;
      }
      setTasks(data || []);

      // 2. Subscribe to Realtime
      channel = supabase
        .channel(`tasks:${currentUser}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${currentUser}`,
          },
          (payload) => {
            if (!isMounted) return;

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
        .subscribe((status) => {
          console.log('Realtime status:', status); // Should log "SUBSCRIBED"
        });
    };

    setupRealtime();

    // Cleanup
    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentUser]);

  // ADD TASK
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
      alert('Failed to add task: ' + error.message);
      return;
    }

    // UI updates immediately
    setTasks(prev => [data, ...prev]);
  };

  // TOGGLE COMPLETE
  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const completed = !task.completed;
    const completed_at = completed ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at })
      .eq('id', id);

    if (error) {
      console.error('Toggle error:', error);
      alert('Failed to update task');
      return;
    }

    // UI updates immediately
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed, completed_at }
          : t
      )
    );
  };

  // DELETE TASK
  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      alert('Failed to delete task');
      return;
    }

    // UI updates immediately
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // DOWNLOAD BACKUP
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

  // UPLOAD BACKUP
  const uploadBackup = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const parsed: Task[] = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('Invalid backup format');

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
          console.error('Upload backup error:', err);
          alert('Failed to restore: ' + err.message);
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