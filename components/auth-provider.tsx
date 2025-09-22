"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Auth } from "aws-amplify";
import "@/lib/amplify";

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Only redirect to dashboard when authenticated and on login page
    if (!isLoading && isAuthenticated && pathname === "/") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const user = await Auth.signIn(email, password);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name,
        },
      });
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      await Auth.confirmSignUp(email, code);
    } catch (error: any) {
      throw new Error(error.message || "Email verification failed");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await Auth.forgotPassword(email);
    } catch (error: any) {
      throw new Error(error.message || "Password reset failed");
    }
  };

  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
    } catch (error: any) {
      throw new Error(error.message || "Password reset confirmation failed");
    }
  };

  const logout = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      router.push("/");
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      signup, 
      logout, 
      confirmSignup, 
      resetPassword, 
      confirmPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
