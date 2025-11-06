"use client";

import { useState } from "react";
import React from "react";
import { WarrantyRule, WarrantyRuleType } from "@/lib/types/admin";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface WarrantyRulesTableProps {
  rules: WarrantyRule[];
  onEdit: (rule: WarrantyRule) => void;
  onDelete: (ruleId: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

export default function WarrantyRulesTable({
  rules,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  sortColumn = "priority",
  sortDirection = "asc",
  onSort,
}: WarrantyRulesTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const handleToggleExpand = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const handleDeleteClick = (ruleId: string) => {
    if (deleteConfirm === ruleId) {
      onDelete(ruleId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(ruleId);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getRuleTypeBadge = (ruleType: WarrantyRuleType) => {
    const badges = {
      maintenance:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
      exclusion: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
      positive:
        "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    };

    const labels = {
      maintenance: "Maintenance",
      exclusion: "Exclusion",
      positive: "Positive",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badges[ruleType]}`}
      >
        {labels[ruleType]}
      </span>
    );
  };

  const getAdjustmentBadge = (adjustment: number) => {
    const adjustmentNum =
      typeof adjustment === "number"
        ? adjustment
        : parseFloat(String(adjustment)) || 0;
    const isNegative = adjustmentNum < 0;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isNegative
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
        }`}
      >
        {isNegative ? "" : "+"}
        {adjustmentNum.toFixed(2)}
      </span>
    );
  };

  const handleSort = (column: string) => {
    if (!onSort) return;

    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      onSort(column, sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      onSort(column, "asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="ml-1 inline-block opacity-40" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="ml-1 inline-block" />
    ) : (
      <ArrowDown size={14} className="ml-1 inline-block" />
    );
  };

  return (
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
                onClick={() => handleSort("ruleType")}
              >
                Type
                <SortIcon column="ruleType" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("category")}
              >
                Category
                <SortIcon column="category" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("keywordPattern")}
              >
                Keyword Pattern
                <SortIcon column="keywordPattern" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("adjustment")}
              >
                Adjustment
                <SortIcon column="adjustment" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Scope
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("priority")}
              >
                Priority
                <SortIcon column="priority" />
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => handleSort("isActive")}
              >
                Status
                <SortIcon column="isActive" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No warranty rules found. Create your first rule to get
                  started.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <React.Fragment key={rule.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleExpand(rule.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        {expandedRules.has(rule.id) ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getRuleTypeBadge(rule.ruleType)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {rule.category}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate"
                        title={rule.keywordPattern}
                      >
                        {rule.keywordPattern}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getAdjustmentBadge(rule.adjustment)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {rule.state && (
                          <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-1">
                            State: {rule.state}
                          </div>
                        )}
                        {rule.oemMake && (
                          <div className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            OEM: {rule.oemMake}
                          </div>
                        )}
                        {!rule.state && !rule.oemMake && (
                          <span className="text-gray-500 dark:text-gray-400">
                            All
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {rule.priority}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rule.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(rule)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(rule.id)}
                        className={`${
                          deleteConfirm === rule.id
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        }`}
                      >
                        {deleteConfirm === rule.id ? "Confirm?" : "Delete"}
                      </button>
                    </td>
                  </tr>
                  {expandedRules.has(rule.id) && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-4 bg-gray-50 dark:bg-gray-900/30"
                      >
                        <div className="ml-8 space-y-3">
                          {rule.description && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Description
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {rule.description}
                              </p>
                            </div>
                          )}
                          {rule.notes && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Notes
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {rule.notes}
                              </p>
                            </div>
                          )}
                          {!rule.description && !rule.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              No additional details available
                            </p>
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
