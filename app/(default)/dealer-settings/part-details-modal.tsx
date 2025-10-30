"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { X, Loader2 } from "lucide-react";

interface PartDetail {
  id: string;
  part_number: string;
  part_description: string | null;
  quantity: number | null;
  unit_cost: number | null;
  unit_sale: number | null;
  total_cost: number | null;
  total_sale: number | null;
  operation_code: string;
  operation_description: string | null;
  ro_number: string | null;
}

interface PartDetailsResponse {
  partNumber: string;
  parts: PartDetail[];
  summary: {
    totalQuantity: number;
    totalCost: number;
    totalSale: number;
  };
}

interface PartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: string;
  partNumber: string;
  dealerId: string;
}

export default function PartDetailsModal({
  isOpen,
  onClose,
  operationId,
  partNumber,
  dealerId,
}: PartDetailsModalProps) {
  const { getAuthToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PartDetailsResponse | null>(null);

  useEffect(() => {
    if (isOpen && operationId && partNumber) {
      fetchPartDetails();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, operationId, partNumber]);

  const fetchPartDetails = async () => {
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

      const encodedPartNumber = encodeURIComponent(partNumber);
      const response = await fetch(
        `/api/dealer-settings/operations/${operationId}/parts/${encodedPartNumber}?dealerId=${dealerId}`,
        { headers }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch part details");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load part details");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "$0.00";
    }
    return `$${Number(value).toFixed(2)}`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    return Number(value).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Part Details: {partNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-violet-500" size={32} />
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              {/* Summary */}
              {data.summary && (
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Quantity
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {formatNumber(data.summary.totalQuantity)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Cost
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.totalCost)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total Sale
                      </div>
                      <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.summary.totalSale)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Operation Info */}
              {data.parts.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Operation Information
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Operation Code:</span>{" "}
                      {data.parts[0].operation_code}
                    </div>
                    {data.parts[0].operation_description && (
                      <div className="mt-1">
                        <span className="font-medium">Description:</span>{" "}
                        {data.parts[0].operation_description}
                      </div>
                    )}
                    {data.parts[0].ro_number && (
                      <div className="mt-1">
                        <span className="font-medium">RO Number:</span>{" "}
                        {data.parts[0].ro_number}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Part Details Table */}
              {data.parts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Part Line Items ({data.parts.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Sale
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Sale
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.parts.map((part) => (
                          <tr
                            key={part.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              {part.part_description || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatNumber(part.quantity)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(part.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                              {formatCurrency(part.unit_sale)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(part.total_cost)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(part.total_sale)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

