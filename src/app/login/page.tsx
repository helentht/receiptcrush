"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Info } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get('next') || '';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsEmailLoading(true);
    setError("");
    setMessage("");

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (nextRoute) callbackUrl.searchParams.set('next', nextRoute);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setIsEmailLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    if (nextRoute) callbackUrl.searchParams.set('next', nextRoute);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
    // We don't set loading to false on success because it redirects away
  };

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 font-medium">Log in to save your split rooms and claim your avatar across devices.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm mb-6 border border-green-100 flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      <div className="space-y-6">
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isEmailLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 p-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-gray-900 outline-none"
            />
          </div>
          
          <button
            type="submit"
            disabled={isEmailLoading || isGoogleLoading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {isEmailLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Send Magic Link
              </>
            )}
          </button>
        </form>
        
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mt-4"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-indigo-600" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}