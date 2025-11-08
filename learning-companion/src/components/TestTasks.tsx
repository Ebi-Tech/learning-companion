// src/components/TestTasks.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useEffect } from 'react';

export default function TestTasks() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const testInsert = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: 'Test Task from Code',
          type: 'daily',
          completed: false,
        })
        .select();

      console.log('Insert result:', data, error);
    };

    testInsert();
  }, [user]);

  return <div className="p-4 bg-yellow-100">Check console for insert result</div>;
}