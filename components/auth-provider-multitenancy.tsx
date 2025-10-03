"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, resetPassword as cognitoResetPassword, confirmResetPassword, fetchAuthSession } from "aws-amplify/auth";
import "@/lib/amplify";
import { UserProfile, Dealer, UserRole } from "@/lib/types/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  cognitoUser: any;
  currentDealer: Dealer | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDealer: (dealerId: string) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  confirmSignup: (email: string, code: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cognitoUser, setCognitoUser] = useState<any>(null);
  const [currentDealer, setCurrentDealer] = useState<Dealer | null>(null);
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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 5000)
      );
      
      // Check Cognito authentication
      const currentUser = await Promise.race([
        getCurrentUser(),
        timeoutPromise
      ]);
      
      setCognitoUser(currentUser);
      
      // Fetch user's dealer/role data from our backend
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if user exists in our system
        if (data.user && data.user.dealers && data.user.dealers.length > 0) {
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Set current dealer
          const dealer = data.user.dealers.find(
            (d: Dealer) => d.id === data.session?.currentDealerId || data.user.defaultDealerId
          );
          setCurrentDealer(dealer || data.user.dealers[0] || null);
        } else {
          // User authenticated in Cognito but not in our system yet
          setIsAuthenticated(true);
          setCognitoUser(currentUser);
          setUser(null);
          setCurrentDealer(null);
        }
      } else {
        // Backend doesn't have this user's data yet
        // This is expected for Cognito users not yet in our system
        setIsAuthenticated(true);
        setCognitoUser(currentUser);
        setUser(null);
        setCurrentDealer(null);
      }
    } catch (error: any) {
      // Only log unexpected errors (not the normal "user not authenticated" state)
      const errorMessage = error?.message || error?.name || String(error);
      if (!errorMessage.includes('UserUnAuthenticatedException') && 
          !errorMessage.includes('User needs to be authenticated')) {
        console.error("Auth check error:", error);
      }
      setUser(null);
      setCognitoUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );
      
      // Sign in with Cognito
      const cognitoResponse = await Promise.race([
        signIn({ username: email, password }),
        timeoutPromise
      ]);
      
      setCognitoUser(cognitoResponse as any);
      
      // Get Cognito session token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Fetch user's dealer/role data from our backend
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if user exists in our system
        if (data.user && data.user.dealers && data.user.dealers.length > 0) {
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Set current dealer
          const dealer = data.user.dealers.find(
            (d: Dealer) => d.id === data.user.defaultDealerId
          );
          setCurrentDealer(dealer || data.user.dealers[0] || null);
        } else {
          // User authenticated in Cognito but not in our system yet
          setIsAuthenticated(true);
          setUser(null);
          setCurrentDealer(null);
        }
      } else {
        // User authenticated in Cognito but not in our system yet
        setIsAuthenticated(true);
        setUser(null);
        setCurrentDealer(null);
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message?.includes('UserNotFoundException')) {
        throw new Error("No account found with this email address. Please check your email or create a new account.");
      } else if (error.message?.includes('NotAuthorizedException')) {
        throw new Error("Incorrect password. Please try again or reset your password.");
      } else if (error.message?.includes('UserNotConfirmedException')) {
        throw new Error("Your email is not confirmed. Please check your email for the confirmation code and enter it on the signup page.");
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
      // Signup successful - user will need to verify email and then sign in
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
      setCognitoUser(null);
      setUser(null);
      setCurrentDealer(null);
      setIsAuthenticated(false);
      router.push("/");
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  };

  const switchDealer = async (dealerId: string) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      // Get current Cognito token
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch("/api/auth/switch-dealer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dealerId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to switch dealer");
      }

      // Update current dealer in state
      const dealer = user?.dealers.find((d) => d.id === dealerId);
      if (dealer) {
        setCurrentDealer(dealer);
        // Store the selected dealer ID in localStorage for persistence
        localStorage.setItem('titan-current-dealer', dealerId);
      }

      // Refresh the page to reload dealer-specific data
      window.location.reload();
    } catch (error: any) {
      throw new Error(error.message || "Failed to switch dealer");
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        cognitoUser,
        currentDealer,
        login,
        signup,
        logout,
        switchDealer,
        hasRole,
        confirmSignup,
        resetPassword,
        confirmPassword,
      }}
    >
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
