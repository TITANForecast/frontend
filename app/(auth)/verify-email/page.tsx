"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { verifyEmail, resendVerificationCode } from "@/lib/cognito/auth-flows";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    // Get email from query params if redirected from signup/login
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !email) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await verifyEmail(email, code);
      
      if (result.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/?verified=true");
        }, 2000);
      } else {
        setError(result.error || "Failed to verify email");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending || !email) return;

    setIsResending(true);
    setError("");

    try {
      const result = await resendVerificationCode(email);
      
      if (result.success) {
        setDestination(result.destination || "");
        // Show success message temporarily
        const successMsg = `Verification code sent to ${result.destination}`;
        setError(""); // Clear any errors
        // Use a temporary state or toast notification in production
        alert(successMsg);
      } else {
        setError(result.error || "Failed to resend code");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-maroon-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative w-full max-w-md px-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-maroon-800 to-maroon-900 px-8 py-6">
              <div className="flex items-center justify-center mb-4">
                <Image
                  src="/images/logo.png"
                  alt="TITAN Forecast"
                  width={723}
                  height={72}
                  className="h-8 w-auto brightness-0 invert"
                />
              </div>
              <h1 className="text-2xl font-bold text-white text-center">Email Verified!</h1>
            </div>

            <div className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Verification Successful!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your email has been verified. Redirecting you to login...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-maroon-600"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Redirecting...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-maroon-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative w-full max-w-md px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-maroon-800 to-maroon-900 px-8 py-6">
            <div className="flex items-center justify-center mb-4">
              <Image
                src="/images/logo.png"
                alt="TITAN Forecast"
                width={723}
                height={72}
                className="h-8 w-auto brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Verify Your Email</h1>
            <p className="text-maroon-100 text-sm text-center mt-2">
              Enter the verification code sent to your email
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              {!searchParams.get("email") && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              )}

              {email && destination && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Check your email at <strong>{destination}</strong> for the verification code
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  className="block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-maroon-800 to-maroon-900 hover:from-maroon-900 hover:to-maroon-950 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Verify Email</span>
                  </>
                )}
              </button>

              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || !email}
                  className="text-sm text-maroon-600 dark:text-maroon-400 hover:text-maroon-800 dark:hover:text-maroon-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? "Sending..." : "Resend Verification Code"}
                </button>

                <div>
                  <Link
                    href="/"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2025 TITAN Forecast. All rights reserved.
        </p>
      </div>
    </div>
  );
}
