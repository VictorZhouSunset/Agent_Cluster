import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle } from 'lucide-react';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type') as 'signup' | 'recovery' | 'magiclink' | 'invite' | null;
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');

        if (errorParam) {
          setError(errorDescription || errorParam);
          setStatus('error');
          return;
        }

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          });

          if (error) {
            setError(error.message);
            setStatus('error');
          } else {
            setStatus('success');
          }
        } else if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            setError(error.message);
            setStatus('error');
          } else {
            setStatus('success');
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            if (error.message.includes('PKCE') || error.message.includes('code verifier')) {
              setError('This verification link has expired or was opened in a different browser. Please request a new verification email and open it in the same browser where you registered.');
            } else {
              setError(error.message);
            }
            setStatus('error');
          } else {
            setStatus('success');
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setStatus('success');
          } else {
            setError('Invalid verification link. Please try again.');
            setStatus('error');
          }
        }
      } catch (err) {
        setError('An unexpected error occurred during verification');
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-500">Your email has been successfully verified. You can now close this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verifying your email...</h1>
          <p className="text-gray-500">Please wait while we confirm your email address.</p>
        </div>
      </div>
    </div>
  );
}
