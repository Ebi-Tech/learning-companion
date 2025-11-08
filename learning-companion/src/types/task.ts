// src/types/task.ts
export interface Task {
  id: string;
  user_id?: string;
  title: string;
  type: 'daily' | 'weekly';
  completed: boolean;
  completed_at?: string | null;
  created_at?: string;
}