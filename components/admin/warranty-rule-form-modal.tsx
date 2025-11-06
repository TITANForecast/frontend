"use client";

import { useState, useEffect } from "react";
import ModalBlank from "@/components/modal-blank";
import {
  WarrantyRule,
  WarrantyRuleInput,
  WarrantyRuleType,
} from "@/lib/types/admin";
import { authenticatedFetch } from "@/lib/utils/api";

interface WarrantyRuleFormModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  rule?: WarrantyRule;
  onSave: () => void;
  getAuthToken: () => Promise<string | null>;
}

export default function WarrantyRuleFormModal({
  isOpen,
  setIsOpen,
  rule,
  onSave,
  getAuthToken,
}: WarrantyRuleFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ruleForm, setRuleForm] = useState<WarrantyRuleInput>({
    ruleType: "maintenance",
    category: "",
    keywordPattern: "",
    adjustment: 0,
    description: null,
    notes: null,
    state: null,
    oemMake: null,
    isActive: true,
    priority: 100,
  });

  useEffect(() => {
    if (rule) {
      setRuleForm({
        ruleType: rule.ruleType,
        category: rule.category,
        keywordPattern: rule.keywordPattern,
        adjustment: rule.adjustment,
        description: rule.description,
        notes: rule.notes,
        state: rule.state,
        oemMake: rule.oemMake,
        isActive: rule.isActive,
        priority: rule.priority,
      });
    } else {
      // Reset form for new rule
      setRuleForm({
        ruleType: "maintenance",
        category: "",
        keywordPattern: "",
        adjustment: 0,
        description: null,
        notes: null,
        state: null,
        oemMake: null,
        isActive: true,
        priority: 100,
      });
    }
  }, [rule]);

  const handleSaveRule = async () => {
    setLoading(true);
    setError("");

    try {
      // Validation
      if (
        !ruleForm.ruleType ||
        !ruleForm.category ||
        !ruleForm.keywordPattern ||
        ruleForm.adjustment === undefined
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (ruleForm.adjustment < -1 || ruleForm.adjustment > 1) {
        throw new Error("Adjustment must be between -1 and 1");
      }

      if (ruleForm.state && ruleForm.state.length !== 2) {
        throw new Error("State must be a 2-letter US state code");
      }

      const response = await authenticatedFetch(
        rule
          ? `/api/admin/warranty-rules/${rule.id}`
          : "/api/admin/warranty-rules",
        getAuthToken,
        {
          method: rule ? "PATCH" : "POST",
          body: JSON.stringify(ruleForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save warranty rule");
      }

      onSave();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBlank isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {rule ? "Edit Warranty Rule" : "Create New Warranty Rule"}
          </h2>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rule Type *
            </label>
            <select
              className="form-select w-full"
              value={ruleForm.ruleType}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  ruleType: e.target.value as WarrantyRuleType,
                })
              }
            >
              <option value="maintenance">Maintenance</option>
              <option value="exclusion">Exclusion</option>
              <option value="positive">Positive</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maintenance: Scheduled maintenance operations
              <br />
              Exclusion: Operations to exclude from warranty
              <br />
              Positive: Operations that positively indicate warranty eligibility
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={ruleForm.category}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, category: e.target.value })
              }
              placeholder="e.g., Scheduled Maintenance, State Specific, OEM Specific"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Keyword Pattern *
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={ruleForm.keywordPattern}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, keywordPattern: e.target.value })
              }
              placeholder="Text pattern to match in operation descriptions"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pattern to match in operation descriptions (case-insensitive)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adjustment *
            </label>
            <input
              type="number"
              step="0.01"
              min="-1"
              max="1"
              className="form-input w-full"
              value={ruleForm.adjustment}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  adjustment: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Confidence score adjustment (-1 to 1). Negative values reduce
              confidence, positive values increase it.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <input
              type="number"
              className="form-input w-full"
              value={ruleForm.priority}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  priority: parseInt(e.target.value) || 100,
                })
              }
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lower number = higher priority. Rules are evaluated in priority
              order (default: 100).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State (Optional)
            </label>
            <input
              type="text"
              maxLength={2}
              className="form-input w-full"
              value={ruleForm.state || ""}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, state: e.target.value || null })
              }
              placeholder="2-letter US state code (e.g., CA, NY)"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to apply to all states
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              OEM Make (Optional)
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={ruleForm.oemMake || ""}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, oemMake: e.target.value || null })
              }
              placeholder="OEM manufacturer name"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty to apply to all OEMs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              className="form-textarea w-full"
              rows={2}
              value={ruleForm.description || ""}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  description: e.target.value || null,
                })
              }
              placeholder="Human-readable description of the rule"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              className="form-textarea w-full"
              rows={3}
              value={ruleForm.notes || ""}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, notes: e.target.value || null })
              }
              placeholder="Additional notes and context"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rule-active"
              className="form-checkbox"
              checked={ruleForm.isActive}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, isActive: e.target.checked })
              }
            />
            <label
              htmlFor="rule-active"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Active
            </label>
            <p className="ml-4 text-xs text-gray-500 dark:text-gray-400">
              Inactive rules are disabled but not deleted
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
            onClick={handleSaveRule}
            disabled={loading || !ruleForm.category || !ruleForm.keywordPattern}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </ModalBlank>
  );
}
