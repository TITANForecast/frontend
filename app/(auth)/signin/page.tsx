"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation';
import AuthHeader from '../auth-header'
import AuthImage from '../auth-image'
import { useAuth } from '@/components/auth-provider'

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerified(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      // The AuthProvider will handle the redirect to dashboard
    } catch (error: any) {
      setError(error.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative md:flex">

        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <AuthHeader />

            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Welcome back!</h1>
              
              {/* Success Message */}
              {verified && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Email verified successfully! You can now sign in.
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <div className="mb-2">{error}</div>
                  <div className="text-sm">
                    <Link 
                      href="/signup" 
                      className="text-red-600 hover:text-red-800 underline mr-4"
                    >
                      Create Account
                    </Link>
                    <Link 
                      href="/reset-password" 
                      className="text-red-600 hover:text-red-800 underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className={isLoading ? "pointer-events-none opacity-75" : ""}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address</label>
                    <input 
                      id="email" 
                      className="form-input w-full" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
                    <input 
                      id="password" 
                      className="form-input w-full" 
                      type="password" 
                      autoComplete="on" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="mr-1">
                    <Link className="text-sm underline hover:no-underline" href="/reset-password">Forgot Password?</Link>
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>
              {/* Footer */}
              <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                <div className="text-sm">
                  Don't you have an account? <Link className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/signup">Sign Up</Link>
                </div>
                {/* Warning */}
                <div className="mt-5">
                  <div className="bg-yellow-500/20 text-yellow-700 px-3 py-2 rounded-lg">
                    <svg className="inline w-3 h-3 shrink-0 fill-current mr-2" viewBox="0 0 12 12">
                      <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                    </svg>
                    <span className="text-sm">
                      To support you during the pandemic super pro features are free until March 31st.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <AuthImage />

      </div>

    </main>
  )
}
