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

const STORAGE_KEY = 'learning-companion-tasks';
const QUEUE_KEY = 'learning-companion-queue';

export function TaskProvider({ 
  children, 
  currentUser 
}: { 
  children: ReactNode;
  currentUser: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<any[]>([]);

  // Load from localStorage
  const loadLocalTasks = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTasks(parsed);
      } catch (e) {
        console.error('Failed to parse local tasks');
      }
    }
  };

  // Save to localStorage
  const saveLocalTasks = (newTasks: Task[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };

  // Sync queue
  const syncQueue = async () => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (!savedQueue) return;

    const operations = JSON.parse(savedQueue);
    for (const op of operations) {
      try {
        if (op.type === 'insert') {
          await supabase.from('tasks').insert(op.data);
        } else if (op.type === 'update') {
          await supabase.from('tasks').update(op.data).eq('id', op.id);
        } else if (op.type === 'delete') {
          await supabase.from('tasks').delete().eq('id', op.id);
        }
      } catch (err) {
        console.error('Sync failed:', err);
        return false;
      }

    }
    localStorage.removeItem(QUEUE_KEY);
    return true;
  };

  // Online/Offline handlers
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Load + Realtime
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }

    let isMounted = true;
    let channel: any = null;

    const setup = async () => {
      // 1. Try online fetch
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser)
            .order('created_at', { ascending: false });

          if (!isMounted) return;
          if (error) throw error;

          setTasks(data || []);
          saveLocalTasks(data || []);
          await syncQueue();
        } catch (err) {
          console.warn('Online fetch failed, using local cache');
          loadLocalTasks();
        }
      } else {
        // 2. Offline: load from cache
        loadLocalTasks();
      }

      // 3. Realtime (only if online)
      if (isOnline) {
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
                saveLocalTasks([newTask, ...tasks]);
              }
              if (payload.eventType === 'UPDATE') {
                setTasks(prev =>
                  prev.map(t => (t.id === newTask.id ? newTask : t))
                );
                saveLocalTasks(tasks.map(t => (t.id === newTask.id ? newTask : t)));
              }
              if (payload.eventType === 'DELETE') {
                setTasks(prev => prev.filter(t => t.id !== oldId));
                saveLocalTasks(tasks.filter(t => t.id !== oldId));
              }
            }
          )
          .subscribe();
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser, isOnline]);

  // Queue operation
  const queueOperation = (type: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    const saved = localStorage.getItem(QUEUE_KEY);
    const queue = saved ? JSON.parse(saved) : [];
    queue.push({ type, data, id });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  };

  // ADD TASK
  const addTask = async (title: string, type: 'daily' | 'weekly') => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: currentUser,
      title: trimmedTitle,
      type,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI
    setTasks(prev => [newTask, ...prev]);
    saveLocalTasks([newTask, ...tasks]);

    if (isOnline) {
      try {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: currentUser,
            title: trimmedTitle,
            type,
            completed: false,
          })
          .select()
          .single();

        if (error) throw error;
      } catch (err) {
        console.error('Add failed:', err);
        queueOperation('insert', {
          user_id: currentUser,
          title: trimmedTitle,
          type,
          completed: false,
        });
      }
    } else {
      queueOperation('insert', {
        user_id: currentUser,
        title: trimmedTitle,
        type,
        completed: false,
      });
    }
  };

  // TOGGLE
  const toggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const completed = !task.completed;
    const completed_at = completed ? new Date().toISOString() : null;

    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed, completed_at } : t
      )
    );
    saveLocalTasks(tasks.map(t => (t.id === id ? { ...t, completed, completed_at } : t)));

    if (isOnline) {
      const { error } = await supabase
        .from('tasks')
        .update({ completed, completed_at })
        .eq('id', id);
      if (error) queueOperation('update', { completed, completed_at }, id);
    } else {
      queueOperation('update', { completed, completed_at }, id);
    }
  };

  // DELETE
  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    saveLocalTasks(tasks.filter(t => t.id !== id));

    if (isOnline) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) queueOperation('delete', null, id);
    } else {
      queueOperation('delete', null, id);
    }
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

          setTasks(parsed);
          saveLocalTasks(parsed);

          if (isOnline) {
            const { error } = await supabase
              .from('tasks')
              .upsert(
                parsed.map(t => ({ ...t, user_id: currentUser })),
                { onConflict: 'id' }
              );
            if (error) throw error;
          }
          resolve();
        } catch (err: any) {
          reject(err);
        }
      };
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