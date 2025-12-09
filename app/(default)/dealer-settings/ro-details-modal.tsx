"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { X, ChevronDown, ChevronRight, Loader2, Download } from "lucide-react";
import { formatCurrency, formatNumber } from "@/components/utils/utils";

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
  operation_code: string;
  operation_description: string;
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
  warranty_evaluation_eligible: boolean | null;
  warranty_evaluation_confidence: number | null;
  warranty_evaluation_reason: string | null;
  warranty_evaluation_rule_applied: string | null;
  warranty_evaluation_user_confirmed: boolean | null;
}

interface RODetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceRecordId: string;
  roNumber: string | null;
  dealerId: string;
  highlightedOperationId?: string; // The operation that was clicked
}

export default function RODetailsModal({
  isOpen,
  onClose,
  serviceRecordId,
  roNumber,
  dealerId,
  highlightedOperationId,
}: RODetailsModalProps) {
  const { getAuthToken } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(
    new Set()
  );
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isOpen && serviceRecordId) {
      fetchOperations();
      // Auto-expand the highlighted operation
      if (highlightedOperationId) {
        setExpandedOperations(new Set([highlightedOperationId]));
      }
    } else {
      setOperations([]);
      setExpandedOperations(new Set());
      setError(null);
    }
  }, [isOpen, serviceRecordId, highlightedOperationId]);

  // Scroll to highlighted operation when operations are loaded
  useEffect(() => {
    if (operations.length > 0 && highlightedOperationId && !loading && isOpen) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const element = document.getElementById(
          `operation-${highlightedOperationId}`
        );
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [operations, highlightedOperationId, loading, isOpen]);

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
        serviceRecordId,
        limit: "1000", // Get all operations for this RO
      });

      if (roNumber) {
        params.append("roNumber", roNumber);
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
      setOperations(result.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (operationId: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationId)) {
      newExpanded.delete(operationId);
    } else {
      newExpanded.add(operationId);
    }
    setExpandedOperations(newExpanded);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
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
      });

      const response = await fetch(
        `/api/dealer-settings/ro/${serviceRecordId}/pdf?${params.toString()}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RO-${roNumber || serviceRecordId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      setError(error.message || "Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
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

        let coefficient = digits[0].toString();
        for (let i = 1; i < digits.length; i++) {
          coefficient += digits[i].toString().padStart(7, "0");
        }

        const decimalPosition = exponent + 1;

        let numStr: string;
        if (decimalPosition <= 0) {
          numStr = "0." + "0".repeat(-decimalPosition) + coefficient;
        } else if (decimalPosition >= coefficient.length) {
          numStr =
            coefficient + "0".repeat(decimalPosition - coefficient.length);
        } else {
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

  // Get RO details from first operation (they all share the same RO)
  const roDetails = operations.length > 0 ? operations[0] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-7xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                RO Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {roNumber || serviceRecordId}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF || loading || operations.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                title="Download RO as PDF"
              >
                {generatingPDF ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  size={32}
                  className="animate-spin text-violet-600 dark:text-violet-400"
                />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 dark:text-red-400">
                Error: {error}
              </div>
            ) : (
              <>
                {/* RO Summary */}
                {roDetails && (
                  <div className="mb-6 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Service Record Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          RO Number
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {roDetails.ro_number || serviceRecordId || "N/A"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Open Date
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {roDetails.service_record_open_date
                            ? new Date(
                                roDetails.service_record_open_date
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Vehicle
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {roDetails.vehicle_year || ""}{" "}
                          {roDetails.vehicle_make || ""}{" "}
                          {roDetails.vehicle_model || ""}
                          {roDetails.vehicle_trim
                            ? ` ${roDetails.vehicle_trim}`
                            : ""}
                        </p>
                        {roDetails.vehicle_vin && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            VIN: {roDetails.vehicle_vin}
                          </p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Customer Name
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {roDetails.customer_name || "N/A"}
                        </p>
                      </div>
                      {roDetails.customer_phone && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Customer Phone
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {roDetails.customer_phone}
                          </p>
                        </div>
                      )}
                      {roDetails.customer_email && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Customer Email
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {roDetails.customer_email}
                          </p>
                        </div>
                      )}
                      {roDetails.customer_address && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Customer Address
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {roDetails.customer_address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Operations List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Operations ({operations.length})
                  </h3>

                  {operations.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No operations found for this RO.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {operations.map((operation) => {
                        const isHighlighted =
                          operation.id === highlightedOperationId;
                        return (
                          <div
                            id={`operation-${operation.id}`}
                            key={operation.id}
                            className={`border rounded-lg ${
                              isHighlighted
                                ? "border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                            }`}
                          >
                            {/* Operation Header */}
                            <div
                              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                                isHighlighted
                                  ? "bg-violet-50 dark:bg-violet-900/20"
                                  : ""
                              }`}
                              onClick={() => handleToggleExpand(operation.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    {expandedOperations.has(operation.id) ? (
                                      <ChevronDown size={18} />
                                    ) : (
                                      <ChevronRight size={18} />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {operation.operation_code}
                                      </span>
                                      {isHighlighted && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-500 text-white">
                                          Selected
                                        </span>
                                      )}
                                      {getWarrantyBadge(
                                        operation.is_warranty_eligible
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      {operation.operation_description}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                                  <div>
                                    {operation.pay_type === "C" &&
                                      "Customer Pay"}
                                    {operation.pay_type === "W" && "Warranty"}
                                    {operation.pay_type === "I" && "Internal"}
                                  </div>
                                  {operation.service_name && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {operation.service_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOperations.has(operation.id) && (
                              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
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
                                        {formatNumber(
                                          parseDecimal(
                                            operation.total_labor_hours
                                          ),
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
                                          parseDecimal(
                                            operation.total_labor_sale
                                          )
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Labor Cost
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(
                                          parseDecimal(
                                            operation.total_labor_cost
                                          )
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Parts Sale Total
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(
                                          parseDecimal(
                                            operation.total_parts_sale
                                          )
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Parts Cost
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(
                                          parseDecimal(
                                            operation.total_parts_cost
                                          )
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
                                              ((partsSale - partsCost) /
                                                partsCost) *
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
                                          {operation.parts_list || "N/A"}
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
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
