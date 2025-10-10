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
    checkAuthStatus();
  }, []);

  useEffect(() => {
    console.log('Auth redirect check - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'pathname:', pathname);
    if (!isLoading && isAuthenticated && pathname === "/") {
      console.log('Redirecting to dashboard...');
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const checkAuthStatus = async () => {
    try {
      // Check if we should use mock authentication
      const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';
      const useCognito = process.env.NEXT_PUBLIC_USE_COGNITO === 'true';
      
      console.log('Auth check - useMockAuth:', useMockAuth, 'useCognito:', useCognito);
      
      // Use mock authentication if explicitly enabled
      if (useMockAuth && !useCognito) {
        const mockUser: UserProfile = {
          id: 'dev-user-1',
          email: 'dev@titan.com',
          name: 'Dev User',
          role: UserRole.SUPER_ADMIN,
          defaultDealerId: 'dealer-1',
          isActive: true,
          dealers: [
            {
              id: 'dealer-1',
              name: 'Titan Motors',
              address: '123 Main St',
              phone: '555-0123',
              city: 'Anytown',
              state: 'CA',
              zip: '12345',
              isActive: true
            }
          ]
        };
        
        setUser(mockUser);
        setCurrentDealer(mockUser.dealers[0]);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Production Cognito authentication
      console.log('Attempting Cognito authentication...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      );
      
      const authPromise = getCurrentUser();
      const user = await Promise.race([authPromise, timeoutPromise]);
      
      console.log('Cognito user result:', user);
      
      if (user) {
        setCognitoUser(user);
        // Fetch user profile from API
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userProfile = await response.json();
          setUser(userProfile);
          setCurrentDealer(userProfile.dealers[0]);
          setIsAuthenticated(true);
          console.log('User authenticated via Cognito');
        }
      }
    } catch (error) {
      console.log('Not authenticated:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signIn({ username: email, password });
      await checkAuthStatus();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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
            name
          }
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear all local state first
      setIsAuthenticated(false);
      setUser(null);
      setCurrentDealer(null);
      console.log('Cleared local state');
      
      // Sign out from Cognito - handle case where user is already authenticated
      try {
        await signOut();
        console.log('Signed out from Cognito');
      } catch (error) {
        console.log('SignOut error (may be expected):', error);
        // Force signout even if there's an error
        try {
          await signOut({ global: true });
          console.log('Force signed out from Cognito');
        } catch (forceError) {
          console.log('Force signOut also failed:', forceError);
        }
      }
      
      // Clear all storage aggressively
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear Amplify-specific cache keys
        const amplifyKeys = Object.keys(localStorage).filter(key => 
          key.includes('amplify') || 
          key.includes('cognito') || 
          key.includes('aws-amplify')
        );
        amplifyKeys.forEach(key => localStorage.removeItem(key));
        
        // Clear any remaining Amplify cache
        try {
          const { clearCache } = await import('aws-amplify/utils');
          clearCache();
        } catch (e) {
          // Ignore if clearCache is not available
        }
      }
      
      // Force page reload to clear any remaining state
      console.log('Redirecting to home page...');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear local state and redirect
      setIsAuthenticated(false);
      setUser(null);
      setCurrentDealer(null);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }
    }
  };

  const switchDealer = async (dealerId: string) => {
    try {
      // Local development
      if (process.env.NODE_ENV === 'development') {
        const selectedDealer = user?.dealers.find(d => d.id === dealerId);
        if (selectedDealer) {
          setCurrentDealer(selectedDealer);
        }
        return;
      }

      // Production API call
      const response = await fetch('/api/auth/switch-dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setCurrentDealer(updatedUser.dealers.find((d: Dealer) => d.id === dealerId));
      }
    } catch (error) {
      console.error('Switch dealer error:', error);
      throw error;
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      console.error('Confirm signup error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await cognitoResetPassword({ username: email });
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const confirmPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword
      });
    } catch (error) {
      console.error('Confirm password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
