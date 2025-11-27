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
        console.log('🔍 Checking URL:', window.location.href);
        console.log('🔍 Hash:', window.location.hash);
        console.log('🔍 Search:', window.location.search);
        
        // Parse both URL search params and hash params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for reset token in both locations
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('type');
        
        console.log('🔍 Access Token:', accessToken);
        console.log('🔍 Refresh Token:', refreshToken);
        console.log('🔍 Token Type:', tokenType);

        // If we have an access token and it's a recovery type, redirect to update password
        if (accessToken && tokenType === 'recovery') {
          console.log('🔐 Password reset flow detected in hash');
          
          try {
            // Set the session using the tokens from the hash
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              console.error('❌ Error setting session:', error);
            } else if (session) {
              console.log('✅ Session set successfully, redirecting to update password');
              // Clear the URL hash to prevent re-triggering
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/update-password');
              return;
            }
          } catch (sessionError) {
            console.error('❌ Session error:', sessionError);
          }
        }
      } catch (error) {
        console.error('❌ Error checking password reset:', error);
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