// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import AuthForm from '@/components/AuthForm';
import App from './App';
import { TaskProvider } from '@/components/TaskContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingReset, setCheckingReset] = useState(true);

  useEffect(() => {
    const checkPasswordReset = async () => {
      try {
        // Get the current URL hash and search parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check if this is a password reset flow (has token and type=recovery)
        const hasResetToken = urlParams.has('token') || hashParams.has('access_token');
        const isRecoveryType = urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';

        if (hasResetToken && isRecoveryType) {
          console.log('🔐 Password reset flow detected');
          
          // Get session to verify the user is authenticated
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('✅ User authenticated, redirecting to update password');
            // User is authenticated via reset token, redirect to update password
            router.push('/update-password');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking password reset:', error);
      } finally {
        setCheckingReset(false);
      }
    };

    checkPasswordReset();
  }, [router]);

  if (loading || checkingReset) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <TaskProvider currentUser={user.id}>
      <App />
    </TaskProvider>
  ) : (
    <AuthForm />
  );
}