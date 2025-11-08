// src/components/TestAuth.tsx
'use client';

import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    alert(error ? error.message : 'Check email for confirmation!');
    console.log(data);
  };

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    alert(error ? error.message : 'Signed in!');
    console.log(data);
  };

  return (
    <div className="p-8">
      <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} className="border p-2 mr-2" />
      <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="border p-2 mr-2" />
      <button onClick={signUp} className="bg-green-600 text-white px-4 py-2 mr-2">Sign Up</button>
      <button onClick={signIn} className="bg-blue-600 text-white px-4 py-2">Sign In</button>
    </div>
  );
}