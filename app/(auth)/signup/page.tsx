"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthHeader from "../auth-header";
import AuthImage from "../auth-image";
import { useAuth } from "@/components/auth-provider-multitenancy";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Designer");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const { signup, confirmSignup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await signup(email, password, name);
      // Show confirmation code input instead of redirecting
      setNeedsConfirmation(true);
      setSuccess(true);
      setError(""); // Clear any previous errors
    } catch (error: any) {
      setError(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await confirmSignup(email, confirmationCode);
      // Now redirect to signin after successful confirmation
      router.push("/signin?confirmed=true");
    } catch (error: any) {
      setError(error.message || "Invalid confirmation code. Please try again.");
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
                {needsConfirmation ? "Confirm Your Email" : "Create your Account"}
              </h1>

              {/* Success Message */}
              {success && needsConfirmation && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
                  Account created! Please check your email for a confirmation code.
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Show confirmation form if needed */}
              {needsConfirmation ? (
                <form onSubmit={handleConfirmation}>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        htmlFor="confirmationCode"
                      >
                        Confirmation Code <span className="text-maroon-600">*</span>
                      </label>
                      <input
                        id="confirmationCode"
                        className="form-input w-full"
                        type="text"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        placeholder="Enter 6-digit code from email"
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Check your email ({email}) for the confirmation code
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <button
                      type="button"
                      onClick={() => setNeedsConfirmation(false)}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      ← Back to signup
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn bg-maroon-800 text-white hover:bg-maroon-900 dark:bg-maroon-800 dark:text-white dark:hover:bg-maroon-900 ml-3 whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Confirming..." : "Confirm Email"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="email"
                    >
                      Email Address <span className="text-maroon-600">*</span>
                    </label>
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
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="name"
                    >
                      Full Name <span className="text-maroon-600">*</span>
                    </label>
                    <input
                      id="name"
                      className="form-input w-full"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="role"
                    >
                      Your Role <span className="text-maroon-600">*</span>
                    </label>
                    <select 
                      id="role" 
                      className="form-select w-full"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Designer">Designer</option>
                      <option value="Developer">Developer</option>
                      <option value="Accountant">Accountant</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="password"
                    >
                      Password
                    </label>
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
                    <label className="flex items-center">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="text-sm ml-2">
                        Email me about product news.
                      </span>
                    </label>
                  </div>
                   <button
                     type="submit"
                     disabled={isLoading}
                     className="btn bg-maroon-800 text-white hover:bg-maroon-900 dark:bg-maroon-800 dark:text-white dark:hover:bg-maroon-900 ml-3 whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? "Creating Account..." : "Sign Up"}
                   </button>
                </div>
              </form>
              )}
              
              {/* Footer */}
              <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                <div className="text-sm">
                  Have an account?{" "}
                  <Link
                    className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400"
                    href="/signin"
                  >
                    Sign In
                  </Link>
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
