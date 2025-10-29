"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import { Check, X as XIcon } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Opcode {
  code: string;
  is_warranty_eligible: boolean;
  opcode_id: string | null;
  usage_count: number;
}

interface OpcodeManagementProps {
  dealerId: string;
}

export default function OpcodeManagement({ dealerId }: OpcodeManagementProps) {
  const { hasRole, getAuthToken } = useAuth();
  const [opcodes, setOpcodes] = useState<Opcode[]>([]);
  const [originalOpcodes, setOriginalOpcodes] = useState<Opcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [changedOpcodes, setChangedOpcodes] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(false);

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchOpcodes();
  }, [dealerId]);

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
      setOriginalOpcodes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load opcodes");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEligibility = (code: string) => {
    const updatedOpcodes = opcodes.map((opcode) =>
      opcode.code === code
        ? { ...opcode, is_warranty_eligible: !opcode.is_warranty_eligible }
        : opcode
    );
    setOpcodes(updatedOpcodes);

    // Find the original and updated opcode to compare
    const originalOpcode = originalOpcodes.find((o) => o.code === code);
    const updatedOpcode = updatedOpcodes.find((o) => o.code === code);

    const newChangedOpcodes = new Set(changedOpcodes);

    // If the value is different from original, add to changed set
    // If it's the same as original, remove from changed set
    if (
      originalOpcode &&
      updatedOpcode &&
      originalOpcode.is_warranty_eligible !== updatedOpcode.is_warranty_eligible
    ) {
      newChangedOpcodes.add(code);
    } else {
      newChangedOpcodes.delete(code);
    }

    setChangedOpcodes(newChangedOpcodes);
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

      // Update original opcodes to reflect saved state
      setOriginalOpcodes(opcodes);

      // Refresh data
      await fetchOpcodes();
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Custom cell renderer for checkbox
  const CheckboxRenderer = useCallback(
    (props: ICellRendererParams<Opcode>) => {
      const opcode = props.data;
      if (!opcode) return null;

      return (
        <div className="flex items-center justify-center h-full">
          <input
            type="checkbox"
            checked={opcode.is_warranty_eligible}
            onChange={() => handleToggleEligibility(opcode.code)}
            disabled={!canWrite}
            className="form-checkbox h-5 w-5 text-violet-600 dark:text-violet-500 rounded focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      );
    },
    [canWrite, opcodes]
  );

  // AG Grid column definitions
  const columnDefs: ColDef<Opcode>[] = useMemo(
    () => [
      {
        field: "code",
        headerName: "Operation Code",
        flex: 1,
        minWidth: 200,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "usage_count",
        headerName: "Usage Count",
        width: 180,
        filter: "agNumberColumnFilter",
        sortable: true,
        valueFormatter: (params) =>
          params.value ? params.value.toLocaleString() : "0",
        cellStyle: { textAlign: "center" },
        headerClass: "ag-center-header",
        comparator: (valueA: number, valueB: number) => valueA - valueB,
      },
      {
        field: "is_warranty_eligible",
        headerName: "Warranty Eligible",
        width: 180,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          valueGetter: (params: any) =>
            params.data?.is_warranty_eligible ? "Yes" : "No",
        },
        cellRenderer: CheckboxRenderer,
        cellStyle: { textAlign: "center" },
        headerClass: "ag-center-header",
      },
    ],
    [CheckboxRenderer]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      filter: true,
    }),
    []
  );

  const getRowStyle = (params: any) => {
    if (params.data && changedOpcodes.has(params.data.code)) {
      return {
        backgroundColor: isDark
          ? "rgba(139, 92, 246, 0.1)"
          : "rgba(139, 92, 246, 0.05)",
      };
    }
    return undefined;
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

      {/* Opcodes Grid */}
      <div className="w-full" style={{ height: "600px" }}>
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<Opcode>
            rowData={opcodes}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowStyle={getRowStyle}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100]}
            animateRows={true}
            domLayout="normal"
            suppressCellFocus={true}
            theme="legacy"
          />
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Enabling warranty eligibility will allow
          operations with that opcode to be filtered in the Operations
          Management tab.
        </p>
      </div>
    </div>
  );
}
