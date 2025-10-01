"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '../auth-header';
import AuthImage from '../auth-image';
import { useAuth } from '@/components/auth-provider';

export default function VerifyEmail() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmSignup } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the verification parameters from the URL
        const emailParam = searchParams.get('email');
        const codeParam = searchParams.get('code');
        
        // For CONFIRM_WITH_LINK, Cognito includes the verification code in the URL
        if (!emailParam || !codeParam) {
          setError("Invalid verification link. Please check your email and try clicking the link again.");
          setIsVerifying(false);
          return;
        }

        setEmail(emailParam);
        
        // Confirm the signup with the code from the URL
        await confirmSignup(emailParam, codeParam);
        
        setIsSuccess(true);
        setIsVerifying(false);
        
        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push(`/signin?verified=true&email=${encodeURIComponent(emailParam)}`);
        }, 3000);
        
      } catch (error: any) {
        console.error('Email verification error:', error);
        setError(error.message || "Email verification failed. The link may have expired or already been used.");
        setIsVerifying(false);
      }
    };

    // Only run verification if we have the required parameters
    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');
    
    if (emailParam && codeParam) {
      verifyEmail();
    } else {
      setError("Invalid verification link. Please check your email and try clicking the link again.");
      setIsVerifying(false);
    }
  }, [searchParams, confirmSignup, router]);

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">
            <AuthHeader />

            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">
                {isVerifying ? "Verifying Email..." : isSuccess ? "Email Verified!" : "Verification Failed"}
              </h1>
              
              {/* Loading State */}
              {isVerifying && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Verifying your email address...
                  </p>
                </div>
              )}

              {/* Success State */}
              {isSuccess && (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your email has been successfully verified!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Redirecting you to sign in...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                  <div className="space-y-2">
                    <Link 
                      href="/signup" 
                      className="block w-full btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white text-center"
                    >
                      Try Signing Up Again
                    </Link>
                    <Link 
                      href="/signin" 
                      className="block w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-center"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <AuthImage />
      </div>
    </main>
  );
}
