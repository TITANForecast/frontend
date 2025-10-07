"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "./auth-provider-multitenancy";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/background.png')" }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 backdrop-blur-xs"></div>

      {/* Login card */}
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
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <User
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
                placeholder="Enter your password"
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-maroon-300 text-sm text-center bg-maroon-900/20 border border-maroon-800/50 rounded-lg p-3">
              <div className="mb-2">{error}</div>
              <div className="text-xs space-x-4">
                <Link 
                  href="/signup" 
                  className="text-maroon-200 hover:text-maroon-100 underline"
                >
                  Create Account
                </Link>
                <Link 
                  href="/reset-password" 
                  className="text-maroon-200 hover:text-maroon-100 underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-maroon-800 hover:bg-maroon-900 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-maroon-600 focus:ring-offset-2 focus:ring-offset-gray-800 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link 
              href="/signup" 
              className="text-maroon-400 hover:text-maroon-300 font-medium transition-colors"
            >
              Sign Up
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
