// src/utils/storage.ts
import { Task } from '@/types/task';

const TASKS_KEY = 'lc-tasks';

export const getTasks = (): Task[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TASKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};