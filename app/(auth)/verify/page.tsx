"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthHeader from "../auth-header";
import AuthImage from "../auth-image";
import { useAuth } from "@/components/auth-provider";

export default function Verify() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmSignup } = useAuth();

  // Get email from URL params or use a default
  const email = searchParams.get("email") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await confirmSignup(email, code);
      setSuccess(true);
      // Redirect to sign in after successful verification
      setTimeout(() => {
        router.push("/signin?verified=true");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Verification failed. Please try again.");
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
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">
                Verify Your Email
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent a verification code to <strong>{email}</strong>. 
                Please enter the code below to verify your email address.
              </p>

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  Email verified successfully! Redirecting to sign in...
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
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="code"
                    >
                      Verification Code <span className="text-maroon-600">*</span>
                    </label>
                    <input
                      id="code"
                      className="form-input w-full text-center text-lg tracking-widest"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <Link
                    href="/signin"
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Back to Sign In
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="btn bg-maroon-800 text-white hover:bg-maroon-900 dark:bg-maroon-800 dark:text-white dark:hover:bg-maroon-900 ml-3 whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </button>
                </div>
              </form>

              {/* Resend Code Link */}
              <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                <div className="text-sm text-center">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
                    onClick={() => {
                      // TODO: Implement resend verification code
                      alert("Resend functionality coming soon!");
                    }}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AuthImage />
      </div>
    </main>
  );
}
