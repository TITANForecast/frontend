"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Sparkles,
  Edit2,
} from "lucide-react";
import AIEvaluationModal from "@/app/(default)/dealer-settings/ai-evaluation-modal";
import OperationEditModal from "@/app/(default)/dealer-settings/operation-edit-modal";

interface RO {
  service_record_id: string;
  ro_number: string | null;
  ro_open_date: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_mileage: number | null;
  total_labor_sale: number;
  total_labor_hours: number;
  total_parts_sale: number;
  total_parts_cost: number;
  ro_level_elr: number;
  ro_level_parts_markup_percent: number;
}

interface Operation {
  id: string;
  operation_code: string;
  operation_description: string;
  labor_complaint: string | null;
  labor_cause: string | null;
  labor_correction: string | null;
  is_warranty_eligible: boolean | null;
  pay_type: string | null;
  labor_hours: number;
  labor_sale: number;
  parts_sale: number;
  parts_cost: number;
  operation_elr: number;
  parts_markup_percent: number;
  warranty_evaluation_eligible: boolean | null;
  warranty_evaluation_confidence: number | null;
  warranty_evaluation_reason: string | null;
  warranty_evaluation_rule_applied: string | null;
  warranty_evaluation_user_confirmed: boolean | null;
  service_id?: string | null;
  eligibility_notes?: string | null;
}

interface Service {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  } | null;
}

export default function ROSSelection() {
  const { currentDealer, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [windowSize, setWindowSize] = useState<number>(100);
  const [minMileage, setMinMileage] = useState<string>("");
  const [maxMileage, setMaxMileage] = useState<string>("");
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [searchMode, setSearchMode] = useState<"labor" | "parts">("labor");

  // Data
  const [ros, setRos] = useState<RO[]>([]);
  const [expandedROs, setExpandedROs] = useState<Set<string>>(new Set());
  const [roOperations, setROOperations] = useState<Map<string, Operation[]>>(
    new Map()
  );
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  );

  // KPI Summary
  const [averageKPI, setAverageKPI] = useState<number | null>(null);

  // AI Evaluation Modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiEvaluationOperationId, setAIEvaluationOperationId] =
    useState<string>("");

  // Edit Operation Modal
  const [editingOperation, setEditingOperation] = useState<Operation | null>(
    null
  );
  const [services, setServices] = useState<Service[]>([]);

  // Export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (currentDealer) {
      fetchROs();
      fetchServices();
    }
  }, [
    currentDealer,
    eligibleOnly,
    dateRange,
    windowSize,
    minMileage,
    maxMileage,
    minYear,
    maxYear,
    selectedYears,
    searchMode,
  ]);

  const fetchServices = async () => {
    if (!currentDealer) return;

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/services?dealerId=${currentDealer.id}&isActive=true`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  const fetchROs = async () => {
    if (!currentDealer) return;

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

      const params = new URLSearchParams({
        dealerId: currentDealer.id,
        eligibleOnly: eligibleOnly.toString(),
        windowSize: windowSize.toString(),
        searchMode,
      });

      if (dateRange.from) {
        params.append("startDate", dateRange.from.toISOString().split("T")[0]);
      }
      if (dateRange.to) {
        params.append("endDate", dateRange.to.toISOString().split("T")[0]);
      }
      if (minMileage) {
        params.append("minMileage", minMileage);
      }
      if (maxMileage) {
        params.append("maxMileage", maxMileage);
      }
      if (selectedYears.length > 0) {
        params.append("years", selectedYears.join(","));
      } else {
        if (minYear) {
          params.append("minYear", minYear);
        }
        if (maxYear) {
          params.append("maxYear", maxYear);
        }
      }

      const response = await fetch(
        `/api/warranty/ro-optimizer?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch ROs");
      }

      const result = await response.json();
      setRos(result.data || []);

      // Calculate average KPI
      if (result.data && result.data.length > 0) {
        const kpiKey =
          searchMode === "labor"
            ? "ro_level_elr"
            : "ro_level_parts_markup_percent";
        const sum = result.data.reduce(
          (acc: number, ro: any) => acc + (ro[kpiKey] || 0),
          0
        );
        setAverageKPI(sum / result.data.length);
      } else {
        setAverageKPI(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ROs");
      setRos([]);
      setAverageKPI(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationsForRO = async (
    serviceRecordId: string,
    forceRefresh: boolean = false
  ) => {
    if (!currentDealer) return;
    if (!forceRefresh && roOperations.has(serviceRecordId)) return;

    setLoadingOperations((prev) => new Set(prev).add(serviceRecordId));

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/warranty/ro-optimizer/operations?dealerId=${currentDealer.id}&serviceRecordId=${serviceRecordId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch operations");
      }

      const result = await response.json();
      setROOperations((prev) =>
        new Map(prev).set(serviceRecordId, result.data || [])
      );
    } catch (err: any) {
      console.error("Failed to fetch operations:", err);
      // Set empty array on error to prevent showing stale data
      setROOperations((prev) => new Map(prev).set(serviceRecordId, []));
    } finally {
      setLoadingOperations((prev) => {
        const next = new Set(prev);
        next.delete(serviceRecordId);
        return next;
      });
    }
  };

  const handleToggleExpand = (serviceRecordId: string) => {
    const newExpanded = new Set(expandedROs);
    if (newExpanded.has(serviceRecordId)) {
      newExpanded.delete(serviceRecordId);
    } else {
      newExpanded.add(serviceRecordId);
      fetchOperationsForRO(serviceRecordId);
    }
    setExpandedROs(newExpanded);
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
  };

  const handleModalClose = (success: boolean) => {
    setEditingOperation(null);
    if (success && currentDealer) {
      // Refresh operations for all expanded ROs with force refresh
      expandedROs.forEach((roId) => {
        fetchOperationsForRO(roId, true);
      });
      // Recalculate best set if eligibleOnly filter is enabled
      if (eligibleOnly) {
        fetchROs().catch((err) => {
          console.error("Failed to recalculate best set:", err);
        });
      }
    }
  };

  const handleAIEvaluation = (operationId: string) => {
    setAIEvaluationOperationId(operationId);
    setIsAIModalOpen(true);
  };

  const handleExportBestSet = async () => {
    if (!currentDealer || ros.length === 0) return;

    setExporting(true);

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/warranty/ro-optimizer/export?dealerId=${currentDealer.id}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            serviceRecordIds: ros.map((ro) => ro.service_record_id),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export PDFs");
      }

      // Download ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RO-Optimizer-Export-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Failed to export:", err);
      alert("Failed to export PDFs. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!currentDealer) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400">
        Please select a dealer to use RO Selection.
      </div>
    );
  }

  return (
    <div>
      {/* KPI Summary Panel */}
      {ros.length > 0 && averageKPI !== null && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Displayed RO Count
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {ros.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Average {searchMode === "labor" ? "ELR" : "Parts Markup %"}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {searchMode === "labor"
                  ? `$${averageKPI.toFixed(2)}`
                  : `${averageKPI.toFixed(2)}%`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Search Options
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Search Mode */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Mode
            </label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="labor"
                  checked={searchMode === "labor"}
                  onChange={(e) => setSearchMode("labor")}
                  className="form-radio h-4 w-4 text-violet-600 dark:text-violet-500 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Labor
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="parts"
                  checked={searchMode === "parts"}
                  onChange={(e) => setSearchMode("parts")}
                  className="form-radio h-4 w-4 text-violet-600 dark:text-violet-500 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Parts
                </span>
              </label>
            </div>
          </div>

          {/* Window Size */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              # of ROs
            </label>
            <input
              type="number"
              min="1"
              value={windowSize}
              onChange={(e) => setWindowSize(parseInt(e.target.value) || 100)}
              className="form-input w-full min-h-[42px]"
            />
          </div>

          {/* Date Range */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={
                  dateRange.from
                    ? dateRange.from.toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    from: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="form-input w-full min-h-[42px]"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={
                  dateRange.to ? dateRange.to.toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    to: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="form-input w-full min-h-[42px]"
              />
            </div>
          </div>

          {/* Mileage Range */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Mileage
              </label>
              <input
                type="number"
                value={minMileage}
                onChange={(e) => setMinMileage(e.target.value)}
                className="form-input w-full min-h-[42px]"
                placeholder="Optional"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Mileage
              </label>
              <input
                type="number"
                value={maxMileage}
                onChange={(e) => setMaxMileage(e.target.value)}
                className="form-input w-full min-h-[42px]"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Year Range */}
          <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Vehicle Year
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                className="form-input w-full min-h-[42px]"
                placeholder="Optional"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Vehicle Year
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
                className="form-input w-full min-h-[42px]"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(e) => setEligibleOnly(e.target.checked)}
                className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2 shrink-0"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Eligible Only
              </span>
            </label>
          </div>
        </div>

        {/* Export Button */}
        {ros.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleExportBestSet}
              disabled={exporting}
              className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* RO Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Loading ROs...
            </p>
          </div>
        ) : ros.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No ROs found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span className="w-6"></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RO Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RO Open Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Labor Sale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Labor Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RO-level ELR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Parts Sale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    RO-level Parts Markup %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ros.map((ro) => (
                  <React.Fragment key={ro.service_record_id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-4 cursor-default select-none">
                        <button
                          onClick={() =>
                            handleToggleExpand(ro.service_record_id)
                          }
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {expandedROs.has(ro.service_record_id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default select-none">
                        {ro.ro_number || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        {ro.ro_open_date
                          ? new Date(ro.ro_open_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        {ro.vehicle_year && ro.vehicle_make && ro.vehicle_model
                          ? `${ro.vehicle_year} ${ro.vehicle_make} ${ro.vehicle_model}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        {ro.vehicle_mileage
                          ? ro.vehicle_mileage.toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        ${ro.total_labor_sale.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        {ro.total_labor_hours.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        ${ro.ro_level_elr.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        ${ro.total_parts_sale.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 cursor-default select-none">
                        {ro.ro_level_parts_markup_percent.toFixed(2)}%
                      </td>
                    </tr>
                    {expandedROs.has(ro.service_record_id) && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-4 bg-gray-50 dark:bg-gray-900/30"
                        >
                          {loadingOperations.has(ro.service_record_id) ? (
                            <div className="text-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                            </div>
                          ) : (
                            <OperationsTable
                              operations={
                                roOperations.get(ro.service_record_id) || []
                              }
                              onEditOperation={handleEditOperation}
                              onAIEvaluation={handleAIEvaluation}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operation Edit Modal */}
      {editingOperation && currentDealer && (
        <OperationEditModal
          dealerId={currentDealer.id}
          operation={{
            id: editingOperation.id,
            operation_code: editingOperation.operation_code,
            operation_description: editingOperation.operation_description,
            service_id: editingOperation.service_id || null,
            is_warranty_eligible: editingOperation.is_warranty_eligible,
            eligibility_notes: editingOperation.eligibility_notes || null,
          }}
          services={services}
          onClose={handleModalClose}
        />
      )}

      {/* AI Evaluation Modal */}
      <AIEvaluationModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAIEvaluationOperationId("");
        }}
        operationId={aiEvaluationOperationId}
        dealerId={currentDealer.id}
        onEvaluationComplete={async () => {
          // When user confirms/denies an evaluation, update the operation's eligibility
          // to match the evaluation result
          if (aiEvaluationOperationId) {
            // Find which RO contains this operation
            let roIdForOperation: string | null = null;
            roOperations.forEach((ops, roId) => {
              if (ops.some((op) => op.id === aiEvaluationOperationId)) {
                roIdForOperation = roId;
              }
            });

            try {
              // Fetch the latest evaluation to get the confirmed status and eligible value
              const token = await getAuthToken();
              const headers: HeadersInit = {
                "Content-Type": "application/json",
              };
              if (token) {
                headers["Authorization"] = `Bearer ${token}`;
              }

              const evalResponse = await fetch(
                `/api/dealer-settings/operations/${aiEvaluationOperationId}/ai-evaluation?dealerId=${currentDealer.id}`,
                {
                  method: "GET",
                  headers,
                }
              );

              if (evalResponse.ok) {
                const evalData = await evalResponse.json();
                if (
                  evalData &&
                  !evalData.notFound &&
                  evalData.user_confirmed !== null &&
                  evalData.user_confirmed !== undefined
                ) {
                  // When user confirms (user_confirmed = true), set eligibility to match evaluation result
                  // When user denies (user_confirmed = false), set eligibility to opposite of evaluation result
                  const shouldBeEligible =
                    evalData.user_confirmed === true
                      ? evalData.eligible
                      : !evalData.eligible;

                  // Update operation eligibility via API
                  const updateResponse = await fetch(
                    `/api/warranty/ro-optimizer/operations/${aiEvaluationOperationId}/eligibility?dealerId=${currentDealer.id}`,
                    {
                      method: "PATCH",
                      headers,
                      body: JSON.stringify({ isEligible: shouldBeEligible }),
                    }
                  );

                  if (!updateResponse.ok) {
                    console.error(
                      "Failed to update operation eligibility after confirmation"
                    );
                  }
                }
              }
            } catch (err) {
              console.error(
                "Failed to sync operation eligibility after evaluation:",
                err
              );
            }

            // Only refresh operations for the specific RO that contains this operation
            if (roIdForOperation) {
              fetchOperationsForRO(roIdForOperation, true);
            }

            // Only recalculate best set if eligibleOnly filter is enabled
            // (since eligibility changes might affect which ROs are shown)
            if (eligibleOnly) {
              fetchROs().catch((err) => {
                console.error("Failed to recalculate best set:", err);
              });
            }
          }
        }}
      />
    </div>
  );
}

interface OperationsTableProps {
  operations: Operation[];
  onEditOperation: (operation: Operation) => void;
  onAIEvaluation: (operationId: string) => void;
}

function OperationsTable({
  operations,
  onEditOperation,
  onAIEvaluation,
}: OperationsTableProps) {
  const getEligibilityBadge = (eligible: boolean | null) => {
    const label =
      eligible === true
        ? "Eligible"
        : eligible === false
        ? "Not Eligible"
        : "Unknown";
    const className = cn(
      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-center",
      eligible === true &&
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
      eligible === false &&
        "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
      eligible === null &&
        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
    );

    return <span className={className}>{label}</span>;
  };

  if (operations.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No operations found for this RO.
      </div>
    );
  }

  const thClassName =
    "px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className={thClassName}>Operation Code</th>
            <th className={thClassName}>Description</th>
            <th className={thClassName}>Complaint</th>
            <th className={thClassName}>Cause</th>
            <th className={thClassName}>Correction</th>
            <th className={thClassName}>Labor Hours</th>
            <th className={thClassName}>Labor Sale</th>
            <th className={thClassName}>Operation ELR</th>
            <th className={thClassName}>Parts Sale</th>
            <th className={thClassName}>Parts Cost</th>
            <th className={thClassName}>Parts Markup %</th>
            <th className={thClassName}>Eligibility</th>
            <th className={thClassName}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {operations.map((op) => {
            const tdClassName = "px-3 py-2 text-sm cursor-default select-none";

            return (
              <tr
                key={op.id}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-gray-900/30",
                  op.is_warranty_eligible === true &&
                    "bg-green-50 dark:bg-green-900/10"
                )}
              >
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-900 dark:text-gray-100"
                  )}
                >
                  {op.operation_code}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {op.operation_description}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300 max-w-xs truncate"
                  )}
                >
                  {op.labor_complaint || "N/A"}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300 max-w-xs truncate"
                  )}
                >
                  {op.labor_cause || "N/A"}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300 max-w-xs truncate"
                  )}
                >
                  {op.labor_correction || "N/A"}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {op.labor_hours.toFixed(2)}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  ${op.labor_sale.toFixed(2)}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  ${op.operation_elr.toFixed(2)}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  ${op.parts_sale.toFixed(2)}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {op.parts_cost > 0 ? `$${op.parts_cost.toFixed(2)}` : "N/A"}
                </td>
                <td
                  className={cn(
                    tdClassName,
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {op.parts_markup_percent.toFixed(2)}%
                </td>
                <td className={tdClassName}>
                  {getEligibilityBadge(op.is_warranty_eligible)}
                </td>
                <td className={tdClassName}>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditOperation(op)}
                      className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
                      title="Edit Operation"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => onAIEvaluation(op.id)}
                      className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
                      title="Run AI Evaluation"
                    >
                      <Sparkles size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
