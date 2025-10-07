"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, resetPassword as cognitoResetPassword, confirmResetPassword } from "aws-amplify/auth";
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
  const [user, setUser] = useState<any>(null);
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
    console.log('🔍 Checking authentication status...');
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      console.log('📡 Calling getCurrentUser...');
      const currentUser = await Promise.race([
        getCurrentUser(),
        timeoutPromise
      ]);
      
      console.log('✅ User authenticated:', currentUser);
      setUser(currentUser as any);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('❌ Auth check failed:', error);
      console.log('❌ Setting user as not authenticated');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Starting login process for:', email);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );
      
      console.log('📡 Calling signIn with Amplify...');
      const user = await Promise.race([
        signIn({ username: email, password }),
        timeoutPromise
      ]);
      
      console.log('✅ Login successful, user object:', user);
      
      // Type assertion for user object
      const userObj = user as any;
      
      // Check if user needs to confirm signup
      if (userObj.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        console.log('📧 User needs to confirm email address');
        throw new Error("Please verify your email address before signing in. Check your email for a verification link.");
      }
      
      // Check if user is actually signed in
      if (!userObj.isSignedIn) {
        console.log('❌ User is not signed in despite successful response');
        throw new Error("Authentication failed. Please try again.");
      }
      
      setUser(user as any);
      setIsAuthenticated(true);
      
      console.log('🔄 Redirecting to dashboard...');
      // Immediately redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error('❌ Login failed with error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        httpStatusCode: error.metadata?.httpStatusCode,
        underlyingError: error.underlyingError
      });
      
      // Provide more helpful error messages
      if (error.message?.includes('UserNotFoundException')) {
        throw new Error("No account found with this email address. Please check your email or create a new account.");
      } else if (error.message?.includes('NotAuthorizedException')) {
        throw new Error("Incorrect password. Please try again or reset your password.");
      } else if (error.message?.includes('UserNotConfirmedException')) {
        // Don't redirect automatically - let user see the error message
        throw new Error("Please verify your email address before signing in. Check your email for a verification link.");
      } else if (error.message?.includes('TooManyRequestsException')) {
        throw new Error("Too many login attempts. Please wait a moment and try again.");
      } else {
        throw new Error(error.message || "Login failed. Please try again.");
      }
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error: any) {
      throw new Error(error.message || "Email verification failed");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await cognitoResetPassword({ username: email });
    } catch (error: any) {
      throw new Error(error.message || "Password reset failed");
    }
  };

  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
    } catch (error: any) {
      throw new Error(error.message || "Password reset confirmation failed");
    }
  };

  const logout = async () => {
    try {
      await signOut();
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
