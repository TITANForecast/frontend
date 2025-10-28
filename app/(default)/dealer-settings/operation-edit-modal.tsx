"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { X } from "lucide-react";

interface Operation {
  id: string;
  service_id: string | null;
  is_warranty_eligible: boolean | null;
  eligibility_notes: string | null;
  operation_code: string;
  operation_description: string;
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

interface OperationEditModalProps {
  dealerId: string;
  operation?: Operation;
  operationIds?: string[];
  services: Service[];
  onClose: (success: boolean) => void;
  isBulk?: boolean;
}

export default function OperationEditModal({
  dealerId,
  operation,
  operationIds = [],
  services,
  onClose,
  isBulk = false,
}: OperationEditModalProps) {
  const { getAuthToken } = useAuth();
  const [serviceId, setServiceId] = useState<string>(
    operation?.service_id || ""
  );
  const [warrantyEligible, setWarrantyEligible] = useState<string>(
    operation?.is_warranty_eligible === null
      ? "unset"
      : operation?.is_warranty_eligible
      ? "yes"
      : "no"
  );
  const [eligibilityNotes, setEligibilityNotes] = useState(
    operation?.eligibility_notes || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Prepare warranty eligible value
      let warrantyValue: boolean | null = null;
      if (warrantyEligible === "yes") warrantyValue = true;
      else if (warrantyEligible === "no") warrantyValue = false;

      const body = {
        dealerId,
        serviceId: serviceId || null,
        isWarrantyEligible: warrantyValue,
        eligibilityNotes: eligibilityNotes.trim() || null,
      };

      let response;
      if (isBulk) {
        // Bulk update
        response = await fetch("/api/dealer-settings/operations/bulk-update", {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...body,
            operationIds,
          }),
        });
      } else {
        // Single update
        response = await fetch(
          `/api/dealer-settings/operations/${operation?.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
          }
        );
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update operation(s)");
      }

      onClose(true);
    } catch (err: any) {
      setError(err.message || "Failed to update operation(s)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isBulk
              ? `Update ${operationIds.length} Operations`
              : "Edit Operation"}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!isBulk && operation && (
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {operation.operation_code}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {operation.operation_description}
                </div>
              </div>
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Assignment
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="form-select w-full"
            >
              <option value="">Unassigned</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} • {service.category.name}
                  {service.subcategory ? ` → ${service.subcategory.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Warranty Eligible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Warranty Eligible
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="yes"
                  checked={warrantyEligible === "yes"}
                  onChange={(e) => setWarrantyEligible(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Yes
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="no"
                  checked={warrantyEligible === "no"}
                  onChange={(e) => setWarrantyEligible(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  No
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="unset"
                  checked={warrantyEligible === "unset"}
                  onChange={(e) => setWarrantyEligible(e.target.value)}
                  className="form-radio"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Unset
                </span>
              </label>
            </div>
          </div>

          {/* Eligibility Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eligibility Notes
            </label>
            <textarea
              value={eligibilityNotes}
              onChange={(e) => setEligibilityNotes(e.target.value)}
              className="form-textarea w-full"
              rows={4}
              placeholder="Add notes about warranty eligibility..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-violet-500 hover:bg-violet-600 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : isBulk ? "Update All" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
