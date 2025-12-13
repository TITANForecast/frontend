"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";

interface SaveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SaveReportConfig) => Promise<void>;
  reportType: "custom-ro" | "custom-opcode";
}

export interface SaveReportConfig {
  name: string;
  visibility: "local" | "public";
  allowFilters: boolean;
}

export default function SaveReportModal({
  isOpen,
  onClose,
  onSave,
  reportType,
}: SaveReportModalProps) {
  const { user, hasRole } = useAuth();
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"local" | "public">("local");
  const [allowFilters, setAllowFilters] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = hasRole([UserRole.SUPER_ADMIN]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Report name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        visibility,
        allowFilters,
      });

      // Reset form
      setName("");
      setVisibility("local");
      setAllowFilters(true);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName("");
      setVisibility("local");
      setAllowFilters(true);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Save Report
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Report Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter report name..."
              disabled={saving}
              className="form-input w-full"
              autoFocus
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="local"
                  checked={visibility === "local"}
                  onChange={(e) =>
                    setVisibility(e.target.value as "local" | "public")
                  }
                  disabled={saving}
                  className="form-radio text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Local</span> - Only visible to
                  you
                </span>
              </label>
              <label
                className={`flex items-center ${
                  isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                title={
                  !isSuperAdmin
                    ? "Only Super Admins can create public reports"
                    : ""
                }
              >
                <input
                  type="radio"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) =>
                    setVisibility(e.target.value as "local" | "public")
                  }
                  disabled={saving || !isSuperAdmin}
                  className="form-radio text-violet-600 focus:ring-violet-500"
                />
                <span
                  className={`ml-2 text-sm ${
                    isSuperAdmin
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  <span className="font-medium">Public</span> - Visible to all
                  users
                  {!isSuperAdmin && (
                    <span className="text-xs ml-1">(Super Admin only)</span>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Allow Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parameters
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={allowFilters === true}
                  onChange={() => setAllowFilters(true)}
                  disabled={saving}
                  className="form-radio text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Editable</span> - Users can
                  change filters
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={allowFilters === false}
                  onChange={() => setAllowFilters(false)}
                  disabled={saving}
                  className="form-radio text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Locked</span> - Filters are
                  fixed (requires Edit mode to change)
                </span>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> The grouping structure and column layout
              will be saved and locked by default. Use Edit mode to modify these
              settings later.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
