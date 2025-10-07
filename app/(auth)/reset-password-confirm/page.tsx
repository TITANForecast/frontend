"use client";

import { useState } from 'react';
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthHeader from '../auth-header'
import AuthImage from '../auth-image'
import { useAuth } from '@/components/auth-provider-multitenancy'

export default function ResetPasswordConfirm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { confirmPassword: confirmPasswordReset } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL params if available
  useState(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(email, code, newPassword);
      setSuccess(true);
      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push('/signin?reset=true');
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Password reset failed. Please check your code and try again.");
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
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Reset your Password</h1>
              
              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Password reset successfully! Redirecting to sign in...
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-medium mb-1" htmlFor="code">Reset Code <span className="text-red-500">*</span></label>
                    <input 
                      id="code" 
                      className="form-input w-full" 
                      type="text" 
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter the code from your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="newPassword">New Password <span className="text-red-500">*</span></label>
                    <input 
                      id="newPassword" 
                      className="form-input w-full" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm New Password <span className="text-red-500">*</span></label>
                    <input 
                      id="confirmPassword" 
                      className="form-input w-full" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link href="/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  Back to Sign In
                </Link>
              </div>
            </div>

          </div>
        </div>

        <AuthImage />

      </div>

    </main>
  )
}
