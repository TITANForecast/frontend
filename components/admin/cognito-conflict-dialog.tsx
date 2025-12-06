"use client";

import { useState } from "react";
import ModalBlank from "@/components/modal-blank";
import { AlertCircle, UserCheck, UserPlus } from "lucide-react";

interface CognitoUser {
  cognitoSub: string;
  email: string;
  name?: string;
  status: string;
  enabled: boolean;
  created: Date;
}

interface CognitoConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingUser: CognitoUser;
  email: string;
  onLinkExisting: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CognitoConflictDialog({
  open,
  onOpenChange,
  existingUser,
  email,
  onLinkExisting,
  onCreateNew,
  onCancel,
  isLoading = false,
}: CognitoConflictDialogProps) {
  const [selectedOption, setSelectedOption] = useState<"link" | "new" | null>(null);

  const handleContinue = () => {
    if (selectedOption === "link") {
      onLinkExisting();
    } else if (selectedOption === "new") {
      onCreateNew();
    }
  };

  return (
    <ModalBlank isOpen={open} setIsOpen={onOpenChange}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            User Already Exists in Cognito
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            A user with the email <strong>{email}</strong> already exists in AWS
            Cognito. Please choose how to proceed.
          </p>
        </div>

        <div className="space-y-4">
          {/* Existing User Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>Cognito Status:</strong> {existingUser.status}
              </p>
              <p>
                <strong>Account Status:</strong>{" "}
                {existingUser.enabled ? "Enabled" : "Disabled"}
              </p>
              {existingUser.name && (
                <p>
                  <strong>Name:</strong> {existingUser.name}
                </p>
              )}
              <p>
                <strong>Created:</strong>{" "}
                {new Date(existingUser.created).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Option 1: Link to Existing */}
          <div
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              selectedOption === "link"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => setSelectedOption("link")}
          >
            <div className="flex items-start gap-3">
              <UserCheck
                className={`mt-1 h-5 w-5 ${selectedOption === "link" ? "text-blue-500" : "text-gray-400"}`}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                  Link to Existing Account
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Associate this database record with the existing Cognito account.
                  The user can login immediately with their current password.
                </p>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ✓ Recommended for existing users
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Create New (DB Only) */}
          <div
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              selectedOption === "new"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => setSelectedOption("new")}
          >
            <div className="flex items-start gap-3">
              <UserPlus
                className={`mt-1 h-5 w-5 ${selectedOption === "new" ? "text-green-500" : "text-gray-400"}`}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                  Create Database Record Only
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a database record without linking to Cognito. Use this for
                  testing or special cases. The user will not be able to login.
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  ⚠️ For testing/special cases only
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
            onClick={handleContinue}
            disabled={!selectedOption || isLoading}
          >
            {isLoading ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>
    </ModalBlank>
  );
}

