"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import {
  Check,
  X as XIcon,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface Opcode {
  code: string;
  is_warranty_eligible: boolean;
  opcode_id: string | null;
  usage_count: number;
}

interface Operation {
  id: string;
  operation_code: string;
  operation_description: string;
  open_date: string | null;
  ro_number: string;
}

interface OpcodeManagementProps {
  dealerId: string;
}

export default function OpcodeManagement({ dealerId }: OpcodeManagementProps) {
  const { hasRole, getAuthToken } = useAuth();
  const [opcodes, setOpcodes] = useState<Opcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changedOpcodes, setChangedOpcodes] = useState<Set<string>>(new Set());
  const [expandedOpcodes, setExpandedOpcodes] = useState<Set<string>>(
    new Set()
  );
  const [opcodeOperations, setOpcodeOperations] = useState<
    Record<string, Operation[]>
  >({});
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortColumn, setSortColumn] = useState<
    "code" | "usage_count" | "is_warranty_eligible"
  >("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const itemsPerPage = 25;

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  useEffect(() => {
    fetchOpcodes();
  }, [dealerId, currentPage]);

  const fetchOpcodes = async () => {
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
        `/api/dealer-settings/opcodes?dealerId=${dealerId}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch opcodes");
      }

      const data = await response.json();
      setOpcodes(data);
      // Note: totalPages will be recalculated based on sorted data
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (err: any) {
      setError(err.message || "Failed to load opcodes");
    } finally {
      setLoading(false);
    }
  };

  const fetchOpcodeOperations = async (code: string) => {
    if (opcodeOperations[code]) {
      return; // Already loaded
    }

    setLoadingOperations(new Set(loadingOperations).add(code));

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/opcodes?dealerId=${dealerId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch operations");
      }

      const data = await response.json();
      setOpcodeOperations({ ...opcodeOperations, [code]: data });
    } catch (err: any) {
      console.error("Failed to load operations:", err);
    } finally {
      const newLoading = new Set(loadingOperations);
      newLoading.delete(code);
      setLoadingOperations(newLoading);
    }
  };

  const handleToggleExpand = (code: string) => {
    const newExpanded = new Set(expandedOpcodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
      fetchOpcodeOperations(code);
    }
    setExpandedOpcodes(newExpanded);
  };

  const handleToggleEligibility = (code: string) => {
    setOpcodes(
      opcodes.map((opcode) =>
        opcode.code === code
          ? { ...opcode, is_warranty_eligible: !opcode.is_warranty_eligible }
          : opcode
      )
    );
    setChangedOpcodes(new Set(changedOpcodes).add(code));
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

      const opcodesToUpdate = opcodes.filter((opcode) =>
        changedOpcodes.has(opcode.code)
      );

      const response = await fetch(
        `/api/dealer-settings/opcodes?dealerId=${dealerId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            opcodes: opcodesToUpdate.map((opcode) => ({
              code: opcode.code,
              is_warranty_eligible: opcode.is_warranty_eligible,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update opcodes");
      }

      setSuccessMessage(
        `Successfully updated ${opcodesToUpdate.length} opcode(s)`
      );
      setChangedOpcodes(new Set());

      // Refresh data
      await fetchOpcodes();
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (
    column: "code" | "usage_count" | "is_warranty_eligible"
  ) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort opcodes
  const sortedOpcodes = [...opcodes].sort((a, b) => {
    let comparison = 0;

    if (sortColumn === "code") {
      comparison = a.code.localeCompare(b.code);
    } else if (sortColumn === "usage_count") {
      comparison = a.usage_count - b.usage_count;
    } else if (sortColumn === "is_warranty_eligible") {
      comparison =
        a.is_warranty_eligible === b.is_warranty_eligible
          ? 0
          : a.is_warranty_eligible
          ? -1
          : 1;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({
    column,
  }: {
    column: "code" | "usage_count" | "is_warranty_eligible";
  }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ml-1 inline-block opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1 inline-block" />
    ) : (
      <ArrowDown size={14} className="ml-1 inline-block" />
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading opcodes...
      </div>
    );
  }

  if (error && opcodes.length === 0) {
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
            Operation Code Management
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure warranty eligibility for each operation code
          </p>
        </div>
        {canWrite && changedOpcodes.size > 0 && (
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="btn bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : `Save Changes (${changedOpcodes.size})`}
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <Check
              className="text-green-600 dark:text-green-400 mr-2"
              size={20}
            />
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

      {/* Opcodes Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span className="w-6"></span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort("code")}
                >
                  Operation Code
                  <SortIcon column="code" />
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort("usage_count")}
                >
                  Usage Count
                  <SortIcon column="usage_count" />
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort("is_warranty_eligible")}
                >
                  Warranty Eligible
                  <SortIcon column="is_warranty_eligible" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedOpcodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No opcodes found.
                  </td>
                </tr>
              ) : (
                sortedOpcodes
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((opcode) => (
                    <React.Fragment key={opcode.code}>
                      <tr
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                          changedOpcodes.has(opcode.code)
                            ? "bg-violet-50/50 dark:bg-violet-900/10"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleToggleExpand(opcode.code)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            {expandedOpcodes.has(opcode.code) ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {opcode.code}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {opcode.usage_count.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opcode.is_warranty_eligible}
                              onChange={() =>
                                handleToggleEligibility(opcode.code)
                              }
                              disabled={!canWrite}
                              className="form-checkbox h-5 w-5 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </label>
                        </td>
                      </tr>
                      {expandedOpcodes.has(opcode.code) && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-4 bg-gray-50 dark:bg-gray-900/30"
                          >
                            <div className="ml-8">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Last 10 Operations
                              </h4>
                              {loadingOperations.has(opcode.code) ? (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Loading operations...
                                </div>
                              ) : opcodeOperations[opcode.code]?.length > 0 ? (
                                <div className="space-y-2">
                                  {opcodeOperations[opcode.code].map(
                                    (operation) => (
                                      <div
                                        key={operation.id}
                                        className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3"
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {operation.operation_description}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              RO: {operation.ro_number} •{" "}
                                              {operation.open_date
                                                ? new Date(
                                                    operation.open_date
                                                  ).toLocaleDateString()
                                                : "N/A"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  No operations found.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          <strong>Note:</strong> Click the arrow to expand and view the last 10
          operations that used each operation code. Enabling warranty
          eligibility will allow operations with that opcode to be filtered in
          the Operations Management tab.
        </p>
      </div>
    </div>
  );
}
