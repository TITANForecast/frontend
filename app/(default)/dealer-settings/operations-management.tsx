"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import {
  Edit2,
  Check,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import OperationEditModal from "./operation-edit-modal";
import PartDetailsModal from "./part-details-modal";
import AIEvaluationModal from "./ai-evaluation-modal";
import RODetailsModal from "./ro-details-modal";
import { formatCurrency, formatNumber } from "@/components/utils/utils";
import MultiSelectDropdown from "@/components/multi-select-dropdown";

interface Operation {
  id: string;
  dealer_id: string;
  service_record_id: string;
  service_record_open_date: string | null;
  ro_number: string | null;
  service_id: string | null;
  service_name: string | null;
  service_category_name: string | null;
  service_subcategory_name: string | null;
  is_warranty_eligible: boolean | null;
  eligibility_notes: string | null;
  ai_confidence_warranty: number | null;
  ai_confidence_service: number | null;
  ai_reasoning_summary: string | null;
  ai_tagged_at: string | null;
  ai_reviewed: boolean | null;
  updated_at: string | null;
  updated_by_user_name: string | null;
  // Additional operation fields
  operation_code: string;
  operation_description: string;
  // Extended fields
  pay_type: string | null;
  vehicle_make: string | null;
  vehicle_year: string | null;
  vehicle_model: string | null;
  vehicle_trim: string | null;
  vehicle_vin: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  total_labor_hours: number;
  total_labor_sale: number;
  total_labor_cost: number;
  total_parts_sale: number;
  total_parts_cost: number;
  parts_count: number;
  parts_list: string | null;
  labor_complaint: string | null;
  labor_cause: string | null;
  labor_correction: string | null;
  labor_comments: string | null;
  // Warranty AI Evaluation fields
  warranty_evaluation_eligible: boolean | null;
  warranty_evaluation_confidence: number | null;
  warranty_evaluation_reason: string | null;
  warranty_evaluation_rule_applied: string | null;
  warranty_evaluation_user_confirmed: boolean | null;
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

interface OperationsManagementProps {
  dealerId: string;
}

export default function OperationsManagement({
  dealerId,
}: OperationsManagementProps) {
  const { hasRole, getAuthToken } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string[]>([]);
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [payTypeFilter, setPayTypeFilter] = useState<string[]>(["C"]); // Default to Customer Pay
  const [eligibleMakesOnly, setEligibleMakesOnly] = useState<boolean>(false);
  const [eligibleOpcodesOnly, setEligibleOpcodesOnly] =
    useState<boolean>(false);
  const [laborPartsFilter, setLaborPartsFilter] = useState<string>(""); // "" (none), "labor", "parts", "laborOrParts"
  const [laborFieldsFilter, setLaborFieldsFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchComplete, setSearchComplete] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Selection
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [allOperationsSelected, setAllOperationsSelected] =
    useState<boolean>(false);
  const [fetchingAllIds, setFetchingAllIds] = useState<boolean>(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(
    null
  );
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(
    new Set()
  );
  const [sortColumn, setSortColumn] = useState<string>(
    "service_record_open_date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Part details modal state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>("");
  const [selectedOperationId, setSelectedOperationId] = useState<string>("");

  // AI evaluation modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiEvaluationOperationId, setAIEvaluationOperationId] =
    useState<string>("");
  const [isBulkAIModalOpen, setIsBulkAIModalOpen] = useState(false);

  // RO details modal state
  const [isROModalOpen, setIsROModalOpen] = useState(false);
  const [selectedServiceRecordId, setSelectedServiceRecordId] =
    useState<string>("");
  const [selectedRONumber, setSelectedRONumber] = useState<string | null>(null);
  const [highlightedOperationId, setHighlightedOperationId] =
    useState<string>("");

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch operations when filters change (reset selections)
  useEffect(() => {
    fetchOperations();
    // Reset selection state when filters change (but not when page changes)
    setSelectedOperations([]);
    setAllOperationsSelected(false);
  }, [
    dealerId,
    serviceFilter,
    warrantyFilter,
    startDate,
    endDate,
    payTypeFilter,
    eligibleMakesOnly,
    eligibleOpcodesOnly,
    laborPartsFilter,
    laborFieldsFilter,
    debouncedSearchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Fetch operations when page changes (preserve selections)
  useEffect(() => {
    fetchOperations();
  }, [currentPage]);

  useEffect(() => {
    fetchServices();
  }, [dealerId]);

  const fetchServices = async () => {
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/services?dealerId=${dealerId}&isActive=true`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      console.error("Failed to load services:", err);
    }
  };

  const fetchOperations = async () => {
    // Only show search loading if there's a search query
    if (debouncedSearchQuery.trim()) {
      setSearchLoading(true);
      setSearchComplete(false);
    }
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
        dealerId,
        page: currentPage.toString(),
        limit: "25",
        sortColumn,
        sortDirection,
      });

      if (serviceFilter.length > 0) {
        params.append("serviceIds", serviceFilter.join(","));
      }

      if (warrantyFilter !== "all") {
        params.append("warrantyEligible", warrantyFilter);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      if (payTypeFilter.length > 0) {
        params.append("payTypes", payTypeFilter.join(","));
      }

      if (eligibleMakesOnly) {
        params.append("eligibleMakesOnly", "true");
      }

      if (eligibleOpcodesOnly) {
        params.append("eligibleOpcodesOnly", "true");
      }

      if (laborPartsFilter) {
        params.append("laborPartsFilter", laborPartsFilter);
      }

      if (laborFieldsFilter.length > 0) {
        params.append("laborFields", laborFieldsFilter.join(","));
      }

      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      const response = await fetch(
        `/api/dealer-settings/operations?${params.toString()}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch operations");
      }

      const result = await response.json();
      setOperations(result.data);
      setPagination(result.pagination || null);

      // Show success indicator for search
      if (debouncedSearchQuery.trim()) {
        setSearchLoading(false);
        setSearchComplete(true);
        // Fade out checkmark after 1.5 seconds
        setTimeout(() => {
          setSearchComplete(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load operations");
      if (debouncedSearchQuery.trim()) {
        setSearchLoading(false);
        setSearchComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOperationIds = async (): Promise<string[]> => {
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch all IDs in batches
      const batchSize = 5000;
      let allIds: string[] = [];
      let currentPage = 1;
      let hasMoreData = true;

      while (hasMoreData) {
        const params = new URLSearchParams({
          dealerId,
          page: currentPage.toString(),
          limit: batchSize.toString(),
          sortColumn,
          sortDirection,
        });

        if (serviceFilter.length > 0) {
          params.append("serviceIds", serviceFilter.join(","));
        }

        if (warrantyFilter !== "all") {
          params.append("warrantyEligible", warrantyFilter);
        }

        if (startDate) {
          params.append("startDate", startDate);
        }

        if (endDate) {
          params.append("endDate", endDate);
        }

        if (payTypeFilter.length > 0) {
          params.append("payTypes", payTypeFilter.join(","));
        }

        if (eligibleMakesOnly) {
          params.append("eligibleMakesOnly", "true");
        }

        if (eligibleOpcodesOnly) {
          params.append("eligibleOpcodesOnly", "true");
        }

        if (laborPartsFilter) {
          params.append("laborPartsFilter", laborPartsFilter);
        }

        if (laborFieldsFilter.length > 0) {
          params.append("laborFields", laborFieldsFilter.join(","));
        }

        if (debouncedSearchQuery.trim()) {
          params.append("search", debouncedSearchQuery.trim());
        }

        const response = await fetch(
          `/api/dealer-settings/operations?${params.toString()}`,
          {
            headers,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch all operation IDs");
        }

        const result = await response.json();
        const batchIds = result.data.map((op: Operation) => op.id);
        allIds = allIds.concat(batchIds);

        // Check if we've fetched all data
        if (
          batchIds.length < batchSize ||
          currentPage >= result.pagination.totalPages
        ) {
          hasMoreData = false;
        } else {
          currentPage++;
        }
      }

      return allIds;
    } catch (err: any) {
      console.error("Failed to fetch all operation IDs:", err);
      throw err;
    }
  };

  const handleSelectAll = async (checked: boolean) => {
    if (checked) {
      // Fetch all operation IDs across all pages
      setFetchingAllIds(true);
      try {
        const allIds = await fetchAllOperationIds();
        setSelectedOperations(allIds);
        setAllOperationsSelected(true);
      } catch (err: any) {
        setError(err.message || "Failed to select all operations");
        // Fallback to selecting current page only
        setSelectedOperations(operations.map((op) => op.id));
        setAllOperationsSelected(false);
      } finally {
        setFetchingAllIds(false);
      }
    } else {
      setSelectedOperations([]);
      setAllOperationsSelected(false);
    }
  };

  const handleSelectOperation = (operationId: string, checked: boolean) => {
    if (checked) {
      setSelectedOperations([...selectedOperations, operationId]);
    } else {
      setSelectedOperations(
        selectedOperations.filter((id) => id !== operationId)
      );
      // If we deselect an item, we're no longer selecting all
      setAllOperationsSelected(false);
    }
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
  };

  const handleBulkUpdate = () => {
    setShowBulkUpdate(true);
  };

  const handleBulkWarrantyEvaluation = () => {
    setIsBulkAIModalOpen(true);
  };

  const handleModalClose = (success: boolean) => {
    setEditingOperation(null);
    setShowBulkUpdate(false);
    if (success) {
      fetchOperations();
      setSelectedOperations([]);
      setAllOperationsSelected(false);
    }
  };

  // Helper function to convert Prisma Decimal objects to numbers
  const parseDecimal = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;

    // Handle Prisma Decimal object format {s: sign, e: exponent, d: [digits]}
    if (typeof value === "object" && "d" in value && Array.isArray(value.d)) {
      try {
        const sign = value.s === -1 ? "-" : "";
        const digits = value.d as number[];
        const exponent = typeof value.e === "number" ? value.e : 0;

        if (digits.length === 0) return 0;

        // Build coefficient from digit chunks
        // digits[0] contains leading digits, rest are 7-digit chunks (Decimal.js uses base 1e7)
        let coefficient = digits[0].toString();
        for (let i = 1; i < digits.length; i++) {
          coefficient += digits[i].toString().padStart(7, "0");
        }

        // Place decimal point based on exponent
        // e is the exponent of the first digit (0-indexed)
        const decimalPosition = exponent + 1;

        let numStr: string;
        if (decimalPosition <= 0) {
          // Number < 1, like 0.00123
          numStr = "0." + "0".repeat(-decimalPosition) + coefficient;
        } else if (decimalPosition >= coefficient.length) {
          // Whole number or has trailing zeros
          numStr =
            coefficient + "0".repeat(decimalPosition - coefficient.length);
        } else {
          // Decimal point in the middle
          numStr =
            coefficient.slice(0, decimalPosition) +
            "." +
            coefficient.slice(decimalPosition);
        }

        return parseFloat(sign + numStr);
      } catch (error) {
        console.error("Error parsing Decimal:", error, value);
        return 0;
      }
    }
    return 0;
  };

  const getWarrantyBadge = (eligible: boolean | null) => {
    if (eligible === null) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
          Unset
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          eligible
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
        }`}
      >
        {eligible ? "Yes" : "No"}
      </span>
    );
  };

  if (loading && operations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading operations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  const handleToggleExpand = (operationId: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationId)) {
      newExpanded.delete(operationId);
    } else {
      newExpanded.add(operationId);
    }
    setExpandedOperations(newExpanded);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1" />
    ) : (
      <ArrowDown size={14} className="ml-1" />
    );
  };

  const handlePartClick = (partNumber: string, operationId: string) => {
    setSelectedPartNumber(partNumber);
    setSelectedOperationId(operationId);
    setIsPartModalOpen(true);
  };

  const handlePartModalClose = () => {
    setIsPartModalOpen(false);
    setSelectedPartNumber("");
    setSelectedOperationId("");
  };

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      const token = await getAuthToken();
      const fetchHeaders: HeadersInit = {};
      if (token) {
        fetchHeaders["Authorization"] = `Bearer ${token}`;
      }

      // Build params with same filters as current view
      const params = new URLSearchParams({
        dealerId,
        sortColumn,
        sortDirection,
      });

      if (serviceFilter.length > 0) {
        params.append("serviceIds", serviceFilter.join(","));
      }

      if (warrantyFilter !== "all") {
        params.append("warrantyEligible", warrantyFilter);
      }

      if (startDate) {
        params.append("startDate", startDate);
      }

      if (endDate) {
        params.append("endDate", endDate);
      }

      if (payTypeFilter.length > 0) {
        params.append("payTypes", payTypeFilter.join(","));
      }

      if (eligibleMakesOnly) {
        params.append("eligibleMakesOnly", "true");
      }

      if (eligibleOpcodesOnly) {
        params.append("eligibleOpcodesOnly", "true");
      }

      if (laborPartsFilter) {
        params.append("laborPartsFilter", laborPartsFilter);
      }

      if (laborFieldsFilter.length > 0) {
        params.append("laborFields", laborFieldsFilter.join(","));
      }

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Use streaming export endpoint for efficient large dataset handling
      const response = await fetch(
        `/api/dealer-settings/operations/export?${params.toString()}`,
        {
          headers: fetchHeaders,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export operations");
      }

      // Get the blob directly from streaming response
      const blob = await response.blob();

      // Trigger download
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `operations_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to export CSV:", err);
      setError(err.message || "Failed to export CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const renderPartsList = (partsList: string | null, operationId: string) => {
    if (!partsList || partsList.trim() === "") {
      return "Parts data available but part numbers not specified";
    }

    // Split by comma and trim each part number
    const partNumbers = partsList
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (partNumbers.length === 0) {
      return "Parts data available but part numbers not specified";
    }

    return (
      <div className="flex flex-wrap gap-2">
        {partNumbers.map((partNumber, index) => (
          <button
            key={index}
            onClick={() => handlePartClick(partNumber, operationId)}
            className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 hover:underline font-medium transition-colors"
          >
            {partNumber}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Search Bar */}
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Operation
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setSearchComplete(false);
                setSearchLoading(false);
              }}
              placeholder="Search operation code, RO number, description, or labor fields..."
              className="form-input w-full pr-10"
            />
            {(searchLoading || searchComplete) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {searchLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin text-gray-400 dark:text-gray-500"
                  />
                ) : searchComplete ? (
                  <Check
                    size={18}
                    className="text-green-500 dark:text-green-400 transition-opacity duration-300"
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input w-full"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input w-full"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={eligibleMakesOnly}
              onChange={(e) => {
                setEligibleMakesOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2 shrink-0"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Eligible Makes Only
            </span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={eligibleOpcodesOnly}
              onChange={(e) => {
                setEligibleOpcodesOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2 shrink-0"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Eligible Opcodes Only
            </span>
          </label>
        </div>

        {/* Service Filter */}
        <div className="sm:col-span-1">
          <MultiSelectDropdown
            label="Service"
            options={[
              { value: "null", label: "Unassigned" },
              ...services.map((service) => ({
                value: service.id,
                label: `${service.name} • ${service.category.name}${
                  service.subcategory ? ` → ${service.subcategory.name}` : ""
                }`,
              })),
            ]}
            value={serviceFilter}
            onChange={(selected) => {
              setServiceFilter(selected);
              setCurrentPage(1);
            }}
            placeholder="Select services..."
          />
        </div>

        {/* Pay Type Filter */}
        <div className="sm:col-span-1">
          <MultiSelectDropdown
            label="Pay Type"
            options={[
              { value: "C", label: "Customer Pay" },
              { value: "W", label: "Warranty" },
              { value: "I", label: "Internal" },
            ]}
            value={payTypeFilter}
            onChange={(selected) => {
              setPayTypeFilter(selected);
              setCurrentPage(1);
            }}
            placeholder="Select pay types..."
          />
        </div>

        {/* Warranty Eligible Filter */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warranty Eligible
          </label>
          <select
            value={warrantyFilter}
            onChange={(e) => {
              setWarrantyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select w-full min-h-[42px]"
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
            <option value="null">Unset</option>
          </select>
        </div>

        {/* Labor Fields Filter */}
        <div className="sm:col-span-1">
          <MultiSelectDropdown
            label="Labor Fields"
            options={[
              { value: "complaint", label: "Has Labor Complaint" },
              { value: "cause", label: "Has Labor Cause" },
              { value: "correction", label: "Has Labor Correction" },
              { value: "comment", label: "Has Labor Comment" },
            ]}
            value={laborFieldsFilter}
            onChange={(selected) => {
              setLaborFieldsFilter(selected);
              setCurrentPage(1);
            }}
            placeholder="Select labor fields..."
          />
        </div>

        {/* Labor/Parts Filter */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Labor/Parts Filter
          </label>
          <select
            value={laborPartsFilter}
            onChange={(e) => {
              setLaborPartsFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select w-full sm:min-w-[180px] min-h-[42px]"
          >
            <option value="">All</option>
            <option value="labor">Has Labor</option>
            <option value="parts">Has Parts</option>
            <option value="laborOrParts">Has Labor or Parts</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={exportToCSV}
          disabled={exportLoading}
          className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download size={16} />
              Export to CSV
            </>
          )}
        </button>
      </div>

      {/* Bulk Actions - Sticky */}
      {canWrite && selectedOperations.length > 0 && (
        <div className="sticky top-16 z-40 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
              {allOperationsSelected
                ? `All ${
                    pagination?.total || selectedOperations.length
                  } operation(s) selected`
                : `${selectedOperations.length} operation(s) selected`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkWarrantyEvaluation}
                className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2"
              >
                <Sparkles size={16} />
                Bulk Warranty Evaluation
              </button>
              <button
                onClick={handleBulkUpdate}
                className="btn bg-violet-500 hover:bg-violet-600 text-white"
              >
                Bulk Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operations Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        {refreshing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={32}
                className="animate-spin text-violet-600 dark:text-violet-400"
              />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Refreshing data...
              </p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <span className="w-6"></span>
                </th>
                {canWrite && (
                  <th className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          allOperationsSelected ||
                          (selectedOperations.length === operations.length &&
                            operations.length > 0)
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={fetchingAllIds}
                        className="form-checkbox"
                      />
                      {fetchingAllIds && (
                        <Loader2
                          size={14}
                          className="animate-spin text-gray-400"
                        />
                      )}
                    </div>
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("service_record_open_date")}
                >
                  <div className="flex items-center">
                    Date
                    <SortIcon column="service_record_open_date" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("operation_code")}
                >
                  <div className="flex items-center">
                    Operation
                    <SortIcon column="operation_code" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("pay_type")}
                >
                  <div className="flex items-center">
                    Pay Type
                    <SortIcon column="pay_type" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("service_name")}
                >
                  <div className="flex items-center">
                    Service
                    <SortIcon column="service_name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("service_category_name")}
                >
                  <div className="flex items-center">
                    Category
                    <SortIcon column="service_category_name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("is_warranty_eligible")}
                >
                  <div className="flex items-center">
                    Warranty
                    <SortIcon column="is_warranty_eligible" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleSort("ai_confidence_warranty")}
                >
                  <div className="flex items-center">
                    AI Confidence
                    <SortIcon column="ai_confidence_warranty" />
                  </div>
                </th>
                {canWrite && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {operations.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 10 : 9}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No operations found.
                  </td>
                </tr>
              ) : (
                operations.map((operation) => (
                  <React.Fragment key={operation.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleExpand(operation.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          {expandedOperations.has(operation.id) ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </td>
                      {canWrite && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedOperations.includes(operation.id)}
                            onChange={(e) =>
                              handleSelectOperation(
                                operation.id,
                                e.target.checked
                              )
                            }
                            className="form-checkbox"
                          />
                        </td>
                      )}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {operation.service_record_open_date
                            ? new Date(
                                operation.service_record_open_date
                              ).toLocaleDateString()
                            : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {operation.operation_code}
                        </div>
                        {operation.ro_number && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            RO: {operation.ro_number}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {operation.operation_description}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {operation.pay_type === "C" && "Customer Pay"}
                          {operation.pay_type === "W" && "Warranty"}
                          {operation.pay_type === "I" && "Internal"}
                          {!operation.pay_type && "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {operation.service_name || (
                            <span className="italic text-gray-400">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {operation.service_category_name || "-"}
                        </div>
                        {operation.service_subcategory_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {operation.service_subcategory_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getWarrantyBadge(operation.is_warranty_eligible)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {operation.ai_tagged_at ||
                        operation.warranty_evaluation_confidence !== null ? (
                          <div className="text-xs">
                            <div className="text-gray-600 dark:text-gray-300">
                              Service:{" "}
                              {operation.ai_confidence_service !== null &&
                              operation.ai_confidence_service !== undefined
                                ? `${formatNumber(
                                    operation.ai_confidence_service * 100,
                                    1
                                  )}%`
                                : "-"}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                              Warranty:{" "}
                              {operation.warranty_evaluation_confidence !==
                                null &&
                              operation.warranty_evaluation_confidence !==
                                undefined
                                ? `${formatNumber(
                                    Number(
                                      operation.warranty_evaluation_confidence
                                    ) * 100,
                                    1
                                  )}%`
                                : operation.ai_confidence_warranty !== null &&
                                  operation.ai_confidence_warranty !== undefined
                                ? `${formatNumber(
                                    operation.ai_confidence_warranty * 100,
                                    1
                                  )}%`
                                : "-"}
                            </div>
                            {operation.ai_reviewed === false && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 mt-1">
                                Needs review
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setAIEvaluationOperationId(operation.id);
                                setIsAIModalOpen(true);
                              }}
                              className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                              title="Run Warranty AI"
                            >
                              <Sparkles size={16} />
                            </button>
                            <button
                              onClick={() => handleEditOperation(operation)}
                              className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                              title="Edit operation"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedOperations.has(operation.id) && (
                      <tr>
                        <td
                          colSpan={canWrite ? 10 : 9}
                          className="px-4 py-4 bg-gray-50 dark:bg-gray-900/30"
                        >
                          <div className="ml-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Service Record ID / RO Number
                                </h4>
                                <button
                                  onClick={() => {
                                    setSelectedServiceRecordId(
                                      operation.service_record_id
                                    );
                                    setSelectedRONumber(operation.ro_number);
                                    setHighlightedOperationId(operation.id);
                                    setIsROModalOpen(true);
                                  }}
                                  className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 hover:underline font-medium transition-colors"
                                >
                                  {operation.ro_number ||
                                    operation.service_record_id ||
                                    "N/A"}
                                </button>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Vehicle Make
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {operation.vehicle_make || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Labor Hours
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatNumber(
                                    parseDecimal(operation.total_labor_hours),
                                    2
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Labor Sale Total
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(
                                    parseDecimal(operation.total_labor_sale)
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Labor Cost
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(
                                    parseDecimal(operation.total_labor_cost)
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Parts Sale Total
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(
                                    parseDecimal(operation.total_parts_sale)
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Parts Cost
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrency(
                                    parseDecimal(operation.total_parts_cost)
                                  )}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  ELR (Effective Labor Rate)
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {(() => {
                                    const laborHours = parseDecimal(
                                      operation.total_labor_hours
                                    );
                                    const laborSale = parseDecimal(
                                      operation.total_labor_sale
                                    );
                                    if (laborHours > 0) {
                                      const elr = laborSale / laborHours;
                                      return formatCurrency(elr);
                                    }
                                    return "N/A";
                                  })()}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Part Markup %
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {(() => {
                                    const partsSale = parseDecimal(
                                      operation.total_parts_sale
                                    );
                                    const partsCost = parseDecimal(
                                      operation.total_parts_cost
                                    );
                                    if (partsCost > 0) {
                                      const profitPercent =
                                        ((partsSale - partsCost) / partsCost) *
                                        100;
                                      return `${formatNumber(
                                        profitPercent,
                                        2
                                      )}%`;
                                    }
                                    return "N/A";
                                  })()}
                                </p>
                              </div>
                              {operation.parts_count > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Parts Used ({operation.parts_count})
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {renderPartsList(
                                      operation.parts_list,
                                      operation.id
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Labor Details Section */}

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                  Labor Complaint
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {operation.labor_complaint || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                  Labor Cause
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {operation.labor_cause || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                  Labor Correction
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {operation.labor_correction || "N/A"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                  Labor Comments
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {operation.labor_comments || "N/A"}
                                </p>
                              </div>
                            </div>

                            {/* AI Reasoning Summary Section */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                AI Reasoning Summary
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {operation.ai_reasoning_summary || "N/A"}
                              </p>
                            </div>

                            {/* Warranty AI Evaluation Section */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Warranty AI Evaluation
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Eligibility Decision
                                  </h5>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {operation.warranty_evaluation_eligible ===
                                    true ? (
                                      <span className="text-green-600 dark:text-green-400">
                                        Eligible
                                      </span>
                                    ) : operation.warranty_evaluation_eligible ===
                                      false ? (
                                      <span className="text-red-600 dark:text-red-400">
                                        Not Eligible
                                      </span>
                                    ) : (
                                      "N/A"
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Confidence
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {operation.warranty_evaluation_confidence !==
                                    null
                                      ? `${formatNumber(
                                          Number(
                                            operation.warranty_evaluation_confidence
                                          ) * 100,
                                          1
                                        )}%`
                                      : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    User Confirmation
                                  </h5>
                                  <p className="text-sm text-gray-900 dark:text-gray-100">
                                    {operation.warranty_evaluation_user_confirmed ===
                                    true ? (
                                      <span className="text-green-600 dark:text-green-400">
                                        Confirmed
                                      </span>
                                    ) : operation.warranty_evaluation_user_confirmed ===
                                      false ? (
                                      <span className="text-red-600 dark:text-red-400">
                                        Denied
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 dark:text-gray-400">
                                        Pending
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    AI Reason
                                  </h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                    {operation.warranty_evaluation_reason ||
                                      "N/A"}
                                  </p>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Rule Applied
                                  </h5>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {operation.warranty_evaluation_rule_applied ||
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
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
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            {/* Results info */}
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              <span className="hidden sm:inline">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </span>
              <span className="sm:hidden">
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total}
              </span>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 whitespace-nowrap">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operation Edit Modal */}
      {editingOperation && (
        <OperationEditModal
          dealerId={dealerId}
          operation={editingOperation}
          services={services}
          onClose={handleModalClose}
        />
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <OperationEditModal
          dealerId={dealerId}
          operationIds={selectedOperations}
          services={services}
          onClose={handleModalClose}
          isBulk={true}
        />
      )}

      {/* AI Evaluation Modal */}
      {isAIModalOpen && (
        <AIEvaluationModal
          isOpen={isAIModalOpen}
          onClose={() => {
            setIsAIModalOpen(false);
            setAIEvaluationOperationId("");
          }}
          operationId={aiEvaluationOperationId}
          dealerId={dealerId}
          onEvaluationComplete={async () => {
            // Refresh operations list after evaluation
            setRefreshing(true);
            try {
              await fetchOperations();
            } finally {
              setRefreshing(false);
            }
          }}
        />
      )}

      {/* Bulk AI Evaluation Modal */}
      {isBulkAIModalOpen && (
        <AIEvaluationModal
          isOpen={isBulkAIModalOpen}
          onClose={() => {
            setIsBulkAIModalOpen(false);
            // Clear selections only when modal is closed
            setSelectedOperations([]);
            setAllOperationsSelected(false);
          }}
          operationIds={selectedOperations}
          operations={operations.filter((op) =>
            selectedOperations.includes(op.id)
          )}
          dealerId={dealerId}
          onEvaluationComplete={async () => {
            // Refresh operations list after evaluation
            // Don't clear selections - keep them so user can continue confirming other operations
            setRefreshing(true);
            try {
              await fetchOperations();
            } finally {
              setRefreshing(false);
            }
          }}
        />
      )}

      {/* Part Details Modal */}
      {isPartModalOpen && selectedPartNumber && selectedOperationId && (
        <PartDetailsModal
          isOpen={isPartModalOpen}
          onClose={handlePartModalClose}
          operationId={selectedOperationId}
          partNumber={selectedPartNumber}
          dealerId={dealerId}
        />
      )}

      {/* RO Details Modal */}
      {isROModalOpen && selectedServiceRecordId && (
        <RODetailsModal
          isOpen={isROModalOpen}
          onClose={() => {
            setIsROModalOpen(false);
            setSelectedServiceRecordId("");
            setSelectedRONumber(null);
            setHighlightedOperationId("");
          }}
          serviceRecordId={selectedServiceRecordId}
          roNumber={selectedRONumber}
          dealerId={dealerId}
          highlightedOperationId={highlightedOperationId}
        />
      )}
    </div>
  );
}
