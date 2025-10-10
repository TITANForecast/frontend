"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, User, UserCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider-multitenancy";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      await signup(email, password, name);
      setSuccess(true);
      // Don't redirect - let user see success message and check email
    } catch (error: any) {
      setError(error.message || "Signup failed. Please try again.");
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
              width={723}
              height={72}
              className="w-full h-auto bg-white"
              priority
            />
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800/50 text-green-300 rounded-lg">
            <div className="font-semibold mb-2">Account created successfully!</div>
            <div className="text-sm text-green-400">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </div>
            <div className="mt-3 text-sm">
              <Link href="/" className="text-green-200 hover:text-green-100 underline">
                Go to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* Signup Form */}
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

          {/* Full Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Full Name
            </label>
            <div className="relative">
              <UserCircle
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
              {error}
            </div>
          )}

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

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/" 
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
