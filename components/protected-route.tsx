"use client";

import { useAuth } from "./auth-provider-multitenancy";
import SignIn from "@/app/(auth)/signin/page";
import OnboardingRequired from "./onboarding-required";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <SignIn />;
  }

  // Authenticated but no user data (not in local database)
  if (isAuthenticated && !user) {
    return <OnboardingRequired />;
  }

  // Authenticated and has user data - allow access
  return <>{children}</>;
}
