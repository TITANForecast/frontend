"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import { Save } from "lucide-react";

interface GeneralSettings {
  id: string;
  dealerId: string;
  currentWarrantyLaborRate: number | null;
  currentWarrantyPartsMarkup: number | null;
  lastLaborRateSubmission: string | null;
  lastPartsProfitSubmission: string | null;
  warrantyRequestCooldownPeriod: number;
  createdAt: string;
  updatedAt: string;
}

interface GeneralSettingsProps {
  dealerId: string;
}

export default function GeneralSettings({ dealerId }: GeneralSettingsProps) {
  const { hasRole, getAuthToken } = useAuth();
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [laborRate, setLaborRate] = useState<string>("");
  const [partsMarkup, setPartsMarkup] = useState<string>("");
  const [lastLaborSubmission, setLastLaborSubmission] = useState<string>("");
  const [lastPartsSubmission, setLastPartsSubmission] = useState<string>("");
  const [cooldownPeriod, setCooldownPeriod] = useState<string>("180");

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  useEffect(() => {
    fetchSettings();
  }, [dealerId]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/general?dealerId=${dealerId}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch general settings");
      }

      const data = await response.json();
      setSettings(data);
      setLaborRate(
        data.currentWarrantyLaborRate !== null
          ? String(data.currentWarrantyLaborRate)
          : ""
      );
      setPartsMarkup(
        data.currentWarrantyPartsMarkup !== null
          ? String(data.currentWarrantyPartsMarkup)
          : ""
      );
      setLastLaborSubmission(
        data.lastLaborRateSubmission
          ? new Date(data.lastLaborRateSubmission).toISOString().split("T")[0]
          : ""
      );
      setLastPartsSubmission(
        data.lastPartsProfitSubmission
          ? new Date(data.lastPartsProfitSubmission).toISOString().split("T")[0]
          : ""
      );
      setCooldownPeriod(
        data.warrantyRequestCooldownPeriod !== null
          ? String(data.warrantyRequestCooldownPeriod)
          : "180"
      );
    } catch (err: any) {
      setError(err.message || "Failed to load general settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canWrite) {
      setError("You do not have permission to save settings");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload: {
        currentWarrantyLaborRate?: number | null;
        currentWarrantyPartsMarkup?: number | null;
        lastLaborRateSubmission?: string | null;
        lastPartsProfitSubmission?: string | null;
        warrantyRequestCooldownPeriod?: number | null;
      } = {};

      // Parse and validate labor rate
      if (laborRate.trim() !== "") {
        const parsed = parseFloat(laborRate);
        if (isNaN(parsed) || parsed < 0) {
          throw new Error(
            "Current Warranty Labor Rate must be a non-negative number"
          );
        }
        payload.currentWarrantyLaborRate = parsed;
      } else {
        payload.currentWarrantyLaborRate = null;
      }

      // Parse and validate parts markup
      if (partsMarkup.trim() !== "") {
        const parsed = parseFloat(partsMarkup);
        if (isNaN(parsed) || parsed < 0) {
          throw new Error(
            "Current Warranty Parts Markup must be a non-negative number"
          );
        }
        payload.currentWarrantyPartsMarkup = parsed;
      } else {
        payload.currentWarrantyPartsMarkup = null;
      }

      // Parse and validate cooldown period
      if (cooldownPeriod.trim() !== "") {
        const parsed = parseInt(cooldownPeriod, 10);
        if (isNaN(parsed) || parsed < 0) {
          throw new Error(
            "Warranty Request Cooldown Period must be a non-negative integer"
          );
        }
        payload.warrantyRequestCooldownPeriod = parsed;
      } else {
        payload.warrantyRequestCooldownPeriod = 180; // Default
      }

      // Parse dates
      payload.lastLaborRateSubmission = lastLaborSubmission.trim()
        ? lastLaborSubmission.trim()
        : null;
      payload.lastPartsProfitSubmission = lastPartsSubmission.trim()
        ? lastPartsSubmission.trim()
        : null;

      const response = await fetch(
        `/api/dealer-settings/general?dealerId=${dealerId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      const data = await response.json();
      setSettings(data);
      setSuccessMessage("Settings saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading general settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          General Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure general dealer settings including warranty rates and
          markups.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            {successMessage}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Current Warranty Labor Rate */}
        <div>
          <label
            htmlFor="laborRate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Current Warranty Labor Rate ($)
          </label>
          <input
            type="number"
            id="laborRate"
            value={laborRate}
            onChange={(e) => setLaborRate(e.target.value)}
            disabled={!canWrite || saving}
            step="0.01"
            min="0"
            placeholder="Enter labor rate (e.g., 166.59)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The current warranty labor rate used for comparison in the
            dashboard.
          </p>
        </div>

        {/* Current Warranty Parts Markup */}
        <div>
          <label
            htmlFor="partsMarkup"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Current Warranty Parts Markup (%)
          </label>
          <input
            type="number"
            id="partsMarkup"
            value={partsMarkup}
            onChange={(e) => setPartsMarkup(e.target.value)}
            disabled={!canWrite || saving}
            step="0.01"
            min="0"
            placeholder="Enter parts markup percentage (e.g., 67)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The current warranty parts markup percentage used for comparison in
            the dashboard.
          </p>
        </div>

        {/* Last Labor Rate Submission */}
        <div>
          <label
            htmlFor="lastLaborSubmission"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Last Labor Rate Submission (Date)
          </label>
          <input
            type="date"
            id="lastLaborSubmission"
            value={lastLaborSubmission}
            onChange={(e) => setLastLaborSubmission(e.target.value)}
            disabled={!canWrite || saving}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The date when the last labor rate increase request was submitted.
          </p>
        </div>

        {/* Last Parts Profit Submission */}
        <div>
          <label
            htmlFor="lastPartsSubmission"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Last Parts Profit Submission (Date)
          </label>
          <input
            type="date"
            id="lastPartsSubmission"
            value={lastPartsSubmission}
            onChange={(e) => setLastPartsSubmission(e.target.value)}
            disabled={!canWrite || saving}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The date when the last parts profit increase request was submitted.
          </p>
        </div>

        {/* Warranty Request Cooldown Period */}
        <div>
          <label
            htmlFor="cooldownPeriod"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Warranty Request Cooldown Period (Days)
          </label>
          <input
            type="number"
            id="cooldownPeriod"
            value={cooldownPeriod}
            onChange={(e) => setCooldownPeriod(e.target.value)}
            disabled={!canWrite || saving}
            min="0"
            step="1"
            placeholder="Enter cooldown period in days (e.g., 180)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Number of days that must pass after a submission before another
            warranty rate increase request can be submitted. Used for both labor
            and parts.
          </p>
        </div>

        {/* Save Button */}
        {canWrite && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
