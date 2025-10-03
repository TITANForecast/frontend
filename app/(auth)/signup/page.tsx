"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Mail, Briefcase, Shield } from "lucide-react";
import { useAuth } from "@/components/auth-provider-multitenancy";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Designer");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/background.png')" }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 backdrop-blur-xs"></div>

      {/* Signup card */}
      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.png"
              alt="TITAN Forecast Platform"
              width={1000}
              height={1000}
              className="w-full h-auto"
              priority
            />
          </div>
          <h1 className="text-2xl text-white font-bold">
            {needsConfirmation ? "Confirm Your Email" : "Create Your Account"}
          </h1>
        </div>

        {/* Forms */}
        {needsConfirmation ? (
          /* Confirmation Form */
          <form onSubmit={handleConfirmation} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="text-green-300 text-sm text-center bg-green-900/20 border border-green-800/50 rounded-lg p-3">
                Account created! Please check your email for a confirmation
                code.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-maroon-300 text-sm text-center bg-maroon-900/20 border border-maroon-800/50 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Confirmation Code Field */}
            <div>
              <label
                htmlFor="confirmationCode"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirmation Code
              </label>
              <div className="relative">
                <Shield
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="confirmationCode"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Check your email ({email}) for the confirmation code
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-maroon-800 hover:bg-maroon-900 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Confirming...
                  </div>
                ) : (
                  "Confirm Email"
                )}
              </button>
              <button
                type="button"
                onClick={() => setNeedsConfirmation(false)}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                ← Back to signup
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="text-maroon-300 text-sm text-center bg-maroon-900/20 border border-maroon-800/50 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Role
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
                  size={18}
                />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent text-white transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="Designer">Designer</option>
                  <option value="Developer">Developer</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:border-transparent text-white placeholder-gray-400 transition-all duration-200"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Must be at least 8 characters with uppercase, lowercase, and
                numbers
              </p>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-maroon-800 hover:bg-maroon-900 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-maroon-400 hover:text-maroon-300 font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hexagon-pattern {
          background-image: radial-gradient(
              circle at 25px 25px,
              rgba(255, 255, 255, 0.1) 2px,
              transparent 2px
            ),
            radial-gradient(
              circle at 75px 75px,
              rgba(255, 255, 255, 0.05) 2px,
              transparent 2px
            );
          background-size: 100px 100px;
          background-position: 0 0, 50px 50px;
          width: 100%;
          height: 100%;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(1deg);
          }
          66% {
            transform: translateY(10px) rotate(-1deg);
          }
        }
      `}</style>
    </div>
  );
}
