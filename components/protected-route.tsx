"use client";

import { useAuth } from "./auth-provider-multitenancy";
import LoginForm from "./login-form";
import OnboardingRequired from "./onboarding-required";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Authenticated but no user data (not in local database)
  if (isAuthenticated && !user) {
    return <OnboardingRequired />;
  }

  // Authenticated and has user data - allow access
  return <>{children}</>;
}
