"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import { Check, X as XIcon } from "lucide-react";

interface Make {
  name: string;
  is_warranty_eligible: boolean;
  make_id: string | null;
  record_count: number;
}

interface MakeSettingsProps {
  dealerId: string;
}

export default function MakeSettings({ dealerId }: MakeSettingsProps) {
  const { hasRole, getAuthToken } = useAuth();
  const [makes, setMakes] = useState<Make[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changedMakes, setChangedMakes] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 25;

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  useEffect(() => {
    fetchMakes();
  }, [dealerId, currentPage]);

  const fetchMakes = async () => {
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
        `/api/dealer-settings/makes?dealerId=${dealerId}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch makes");
      }

      const data = await response.json();
      setMakes(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (err: any) {
      setError(err.message || "Failed to load makes");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEligibility = (makeName: string) => {
    setMakes(
      makes.map((make) =>
        make.name === makeName
          ? { ...make, is_warranty_eligible: !make.is_warranty_eligible }
          : make
      )
    );
    setChangedMakes(new Set(changedMakes).add(makeName));
  };

  const handleSaveChanges = async () => {
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

      const makesToUpdate = makes.filter((make) =>
        changedMakes.has(make.name)
      );

      const response = await fetch(
        `/api/dealer-settings/makes?dealerId=${dealerId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            makes: makesToUpdate.map((make) => ({
              name: make.name,
              is_warranty_eligible: make.is_warranty_eligible,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update makes");
      }

      setSuccessMessage(
        `Successfully updated ${makesToUpdate.length} make(s)`
      );
      setChangedMakes(new Set());
      
      // Refresh data
      await fetchMakes();
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading makes...
      </div>
    );
  }

  if (error && makes.length === 0) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Vehicle Make Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure warranty eligibility for each vehicle make
          </p>
        </div>
        {canWrite && changedMakes.size > 0 && (
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : `Save Changes (${changedMakes.size})`}
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="text-green-600 dark:text-green-400 mr-2" size={20} />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              {successMessage}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XIcon className="text-red-600 dark:text-red-400 mr-2" size={20} />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">
              {error}
            </span>
          </div>
        </div>
      )}

      {/* Makes Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Make
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Record Count
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Warranty Eligible
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {makes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No makes found.
                  </td>
                </tr>
              ) : (
                makes
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((make) => (
                  <tr
                    key={make.name}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                      changedMakes.has(make.name)
                        ? "bg-violet-50/50 dark:bg-violet-900/10"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {make.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {make.record_count.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={make.is_warranty_eligible}
                          onChange={() => handleToggleEligibility(make.name)}
                          disabled={!canWrite}
                          className="form-checkbox h-5 w-5 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Enabling warranty eligibility for a make will
          allow operations associated with vehicles of that make to be filtered
          in the Operations Management tab.
        </p>
      </div>
    </div>
  );
}

