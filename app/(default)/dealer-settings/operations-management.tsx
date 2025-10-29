"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import {
  Edit2,
  Check,
  X as XIcon,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import OperationEditModal from "./operation-edit-modal";
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
  total_labor_hours: number;
  total_labor_cost: number;
  total_parts_cost: number;
  parts_count: number;
  parts_list: string | null;
  labor_complaint: string | null;
  labor_cause: string | null;
  labor_correction: string | null;
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
  const { user, hasRole, getAuthToken } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
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
  const [hasLaborOrPartsOnly, setHasLaborOrPartsOnly] =
    useState<boolean>(false);

  // Selection
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
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

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  useEffect(() => {
    fetchOperations();
  }, [
    dealerId,
    currentPage,
    serviceFilter,
    warrantyFilter,
    startDate,
    endDate,
    payTypeFilter,
    eligibleMakesOnly,
    eligibleOpcodesOnly,
    hasLaborOrPartsOnly,
    sortColumn,
    sortDirection,
  ]);

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

      if (hasLaborOrPartsOnly) {
        params.append("hasLaborOrPartsOnly", "true");
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
      setTotalPages(result.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOperations(operations.map((op) => op.id));
    } else {
      setSelectedOperations([]);
    }
  };

  const handleSelectOperation = (operationId: string, checked: boolean) => {
    if (checked) {
      setSelectedOperations([...selectedOperations, operationId]);
    } else {
      setSelectedOperations(
        selectedOperations.filter((id) => id !== operationId)
      );
    }
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
  };

  const handleBulkUpdate = () => {
    setShowBulkUpdate(true);
  };

  const handleModalClose = (success: boolean) => {
    setEditingOperation(null);
    setShowBulkUpdate(false);
    if (success) {
      fetchOperations();
      setSelectedOperations([]);
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
        const digits = value.d;
        const exponent = typeof value.e === "number" ? value.e : 0;
        const sign = value.s === -1 ? -1 : 1;

        if (digits.length === 0) return 0;

        // Convert digits array to string representation
        // Handle both single-digit arrays [1, 7, 5] and chunked arrays [17, 5000000]
        let numStr = "";
        for (const d of digits) {
          numStr += String(d);
        }

        // Parse as float
        let numValue = parseFloat(numStr);
        if (isNaN(numValue)) return 0;

        // Decimal.js format: exponent indicates decimal point position
        // For format {s: 1, e: 1, d: [17, 5000000]}
        // Join -> "175000000", exponent=1 means decimal after first digit group
        // More commonly: e represents the position from the start
        // Standard interpretation: value = joined_digits * 10^(e - num_digits + 1)
        if (exponent !== 0 && numStr.length > 0) {
          // Try standard decimal.js parsing: exponent is relative to first digit
          const power = exponent - numStr.length + 1;
          numValue = numValue * Math.pow(10, power);
        }

        return sign * numValue;
      } catch (error) {
        console.error("Error parsing Decimal:", error, value);
        // Fallback: try to extract any reasonable number from the object
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Service Filter */}
        <div>
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
        <div>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warranty Eligible
          </label>
          <select
            value={warrantyFilter}
            onChange={(e) => {
              setWarrantyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select w-full"
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
            <option value="null">Unset</option>
          </select>
        </div>

        {/* Date Range */}

        {/* Checkbox Filters */}
        <div className="flex items-center gap-6">
          <div>
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

          <div>
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
      </div>
      <div className="flex items-center justify-end gap-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={eligibleMakesOnly}
            onChange={(e) => {
              setEligibleMakesOnly(e.target.checked);
              setCurrentPage(1);
            }}
            className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2"
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
            className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Eligible Opcodes Only
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={hasLaborOrPartsOnly}
            onChange={(e) => {
              setHasLaborOrPartsOnly(e.target.checked);
              setCurrentPage(1);
            }}
            className="form-checkbox h-4 w-4 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 mr-2"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Has Labor/Parts Only
          </span>
        </label>
      </div>

      {/* Bulk Actions */}
      {canWrite && selectedOperations.length > 0 && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
              {selectedOperations.length} operation(s) selected
            </span>
            <button
              onClick={handleBulkUpdate}
              className="btn bg-violet-500 hover:bg-violet-600 text-white"
            >
              Bulk Update
            </button>
          </div>
        </div>
      )}

      {/* Operations Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <span className="w-6"></span>
                </th>
                {canWrite && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedOperations.length === operations.length &&
                        operations.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="form-checkbox"
                    />
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
                        {operation.ai_tagged_at ? (
                          <div className="text-xs">
                            <div className="text-gray-600 dark:text-gray-300">
                              Service:{" "}
                              {operation.ai_confidence_service
                                ? `${operation.ai_confidence_service}%`
                                : "-"}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                              Warranty:{" "}
                              {operation.ai_confidence_warranty
                                ? `${operation.ai_confidence_warranty}%`
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
                          <button
                            onClick={() => handleEditOperation(operation)}
                            className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                            title="Edit operation"
                          >
                            <Edit2 size={16} />
                          </button>
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {operation.ro_number ||
                                    operation.service_record_id ||
                                    "N/A"}
                                </p>
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
                                  {parseDecimal(operation.total_labor_hours) > 0
                                    ? parseDecimal(
                                        operation.total_labor_hours
                                      ).toFixed(2)
                                    : "0.00"}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Labor Cost
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  $
                                  {parseDecimal(
                                    operation.total_labor_cost
                                  ).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Parts Cost
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  $
                                  {parseDecimal(
                                    operation.total_parts_cost
                                  ).toFixed(2)}
                                </p>
                              </div>
                              {operation.parts_count > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Parts Used ({operation.parts_count})
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {operation.parts_list &&
                                    operation.parts_list.trim() !== ""
                                      ? operation.parts_list
                                      : "Parts data available but part numbers not specified"}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Labor Details Section */}
                            {(operation.labor_complaint ||
                              operation.labor_cause ||
                              operation.labor_correction) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}
