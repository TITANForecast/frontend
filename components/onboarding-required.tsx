"use client";

import { useAuth } from "./auth-provider-multitenancy";
import { Building2, UserPlus } from "lucide-react";

export default function OnboardingRequired() {
  const { logout, cognitoUser } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4">
              <UserPlus className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
            Account Setup Required
          </h1>
          
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              Your account has been created successfully, but you haven't been assigned to any dealerships yet.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Waiting for Administrator
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    A system administrator needs to assign you to one or more dealerships before you can access the platform.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Your Account:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📧 {cognitoUser?.username || 'Account verified'}
              </p>
            </div>

            <p className="text-sm">
              Please contact your system administrator or TITAN Forecast support to complete your account setup.
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="w-full btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Sign Out
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              Need help? Contact{" "}
              <a href="mailto:support@titanforecast.com" className="text-violet-500 hover:text-violet-600">
                support@titanforecast.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
