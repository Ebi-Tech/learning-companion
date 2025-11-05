// src/types/task.ts
export interface Task {
  id: string;
  title: string;
  type: 'daily' | 'weekly';
  notes?: string;
  dueDate?: string; // ISO string: "2025-11-05"
  completed: boolean;
  completedAt?: string; // ISO timestamp when marked done
}