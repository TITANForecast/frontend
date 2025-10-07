"use client";

import { useAuth } from "./auth-provider-multitenancy";
import LoginForm from "./login-form";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
