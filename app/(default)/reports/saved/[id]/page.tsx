"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ValueGetterParams,
  ICellRendererParams,
} from "ag-grid-community";
import {
  AllCommunityModule,
  ModuleRegistry,
  ClientSideRowModelModule,
} from "ag-grid-community";
import {
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
} from "ag-grid-enterprise";
import { useAuth } from "@/components/auth-provider-multitenancy";
import {
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Edit,
  Save,
  X,
  Trash2,
} from "lucide-react";
import { initializeAgGridLicense } from "@/lib/ag-charts-license";
import RODetailsModal from "@/app/(default)/dealer-settings/ro-details-modal";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { UserRole } from "@/lib/types/auth";
import Toast from "@/components/toast";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

initializeAgGridLicense().catch(console.error);

ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
]);

interface ROPerformanceData {
  operation_id: string;
  service_record_id: string;
  ro_number: string;
  ro_date: string;
  advisor: string;
  ro_mileage: number;
  make: string;
  model: string;
  opcode: string;
  mileage_band: string;
  ro_count: number;
  sales_percent: number;
  labor_hours: number;
  labor_revenue: number;
  labor_rev_per_ro: number;
  labor_gp_percent: number;
  parts_revenue: number;
  parts_gp_percent: number;
  elr: number;
  discount_percent: number;
}

interface OpcodePerformanceData extends ROPerformanceData {
  opcode_description: string;
}

interface SavedReport {
  id: string;
  name: string;
  reportType: string;
  visibility: string;
  allowFilters: boolean;
  filters: any;
  grouping: any;
  columnState: any;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SavedReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const { currentDealer, getAuthToken, user, hasRole } = useAuth();

  const [savedReport, setSavedReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter states
  const [datePreset, setDatePreset] = useState<string>("custom");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPayTypes, setSelectedPayTypes] = useState<string[]>([
    "C",
    "W",
    "I",
  ]);
  const [warrantyEligibility, setWarrantyEligibility] = useState<string>("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedRO, setSelectedRO] = useState<{
    serviceRecordId: string;
    roNumber: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  const canEdit =
    savedReport &&
    ((savedReport.visibility === "local" &&
      savedReport.createdBy === user?.id) ||
      (savedReport.visibility === "public" && hasRole([UserRole.SUPER_ADMIN])));

  // Detect dark mode
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  // Fetch saved report
  useEffect(() => {
    const fetchSavedReport = async () => {
      if (!reportId) return;

      setLoading(true);
      try {
        const token = await getAuthToken();
        const response = await fetch(`/api/reports/saved/${reportId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch saved report");
        }

        const result = await response.json();
        const report = result.data;
        setSavedReport(report);
        setEditedName(report.name);

        // Load saved filters
        if (report.filters) {
          setDatePreset(report.filters.datePreset || "custom");
          setStartDate(report.filters.startDate || "");
          setEndDate(report.filters.endDate || "");
          setSelectedPayTypes(report.filters.payTypes || ["C", "W", "I"]);
          setWarrantyEligibility(report.filters.warrantyEligibility || "all");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load saved report");
      } finally {
        setLoading(false);
      }
    };

    fetchSavedReport();
  }, [reportId, getAuthToken]);

  // Fetch data when report is loaded
  useEffect(() => {
    if (savedReport && currentDealer) {
      fetchData();
    }
  }, [savedReport, currentDealer]);

  const fetchData = useCallback(async () => {
    if (!savedReport || !currentDealer) return;

    setDataLoading(true);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        dealerId: currentDealer.id,
        startDate,
        endDate,
        payTypes: selectedPayTypes.join(","),
        warrantyEligibility,
      });

      const endpoint =
        savedReport.reportType === "custom-ro"
          ? "/api/reports/ro-performance-summary"
          : "/api/reports/opcode-performance-summary";

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [
    savedReport,
    currentDealer,
    startDate,
    endDate,
    selectedPayTypes,
    warrantyEligibility,
    getAuthToken,
  ]);

  // Handle date preset changes
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const endDateStr = today.toISOString().split("T")[0];
    let startDateStr = "";

    switch (preset) {
      case "last30":
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        startDateStr = last30.toISOString().split("T")[0];
        break;
      case "last60":
        const last60 = new Date(today);
        last60.setDate(today.getDate() - 60);
        startDateStr = last60.toISOString().split("T")[0];
        break;
      case "last90":
        const last90 = new Date(today);
        last90.setDate(today.getDate() - 90);
        startDateStr = last90.toISOString().split("T")[0];
        break;
      case "monthToDate":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateStr = monthStart.toISOString().split("T")[0];
        break;
      case "previousMonth":
        const prevMonthStart = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDateStr = prevMonthStart.toISOString().split("T")[0];
        setStartDate(startDateStr);
        setEndDate(prevMonthEnd.toISOString().split("T")[0]);
        return;
      case "yearToDate":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDateStr = yearStart.toISOString().split("T")[0];
        break;
      default:
        // Custom - don't change dates
        return;
    }

    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  const currencyFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "$0.00";
    return `$${Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const numberFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0.00";
    return Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const percentFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0.0%";
    return `${Number(params.value).toFixed(1)}%`;
  };

  const integerFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0";
    return Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Column definitions (simplified version - you'd need the full column defs)
  const columnDefs: ColDef<any>[] = useMemo(() => {
    const isOpcode = savedReport?.reportType === "custom-opcode";

    return [
      ...(isOpcode
        ? [
            {
              field: "opcode",
              headerName: "Opcode",
              width: 180,
              filter: "agTextColumnFilter",
              enableRowGroup: true,
            },
            {
              field: "opcode_description",
              headerName: "Description",
              width: 300,
              filter: "agTextColumnFilter",
              valueGetter: (params: ValueGetterParams) => {
                if (params.node?.group) {
                  return params.node.aggData?.opcode_description || "";
                }
                return params.data?.opcode_description || "";
              },
              aggFunc: "first",
            },
          ]
        : []),
      {
        field: "ro_number",
        headerName: "RO Number",
        width: 180,
        filter: "agTextColumnFilter",
        enableRowGroup: true,
        cellRenderer: (params: ICellRendererParams<any>) => {
          if (!params.value || params.node?.group) {
            return params.value || "";
          }
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rowData = params.data;
                if (rowData) {
                  setSelectedRO({
                    serviceRecordId: rowData.service_record_id,
                    roNumber: rowData.ro_number,
                  });
                  setIsModalOpen(true);
                }
              }}
              className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 hover:underline cursor-pointer"
            >
              {params.value}
            </button>
          );
        },
      },
      {
        field: "ro_date",
        headerName: "RO Date",
        width: 150,
        filter: "agDateColumnFilter",
        valueFormatter: (params) => {
          if (!params.value) return "";
          return new Date(params.value).toLocaleDateString();
        },
      },
      {
        field: "make",
        headerName: "Make",
        width: 150,
        enableRowGroup: true,
        filter: "agSetColumnFilter",
      },
      {
        field: "model",
        headerName: "Model",
        width: 180,
        enableRowGroup: true,
        filter: "agSetColumnFilter",
      },
      {
        field: "advisor",
        headerName: "Advisor",
        width: 180,
        enableRowGroup: true,
        filter: "agSetColumnFilter",
      },
      {
        field: "mileage_band",
        headerName: "Mileage Band",
        width: 180,
        enableRowGroup: true,
        filter: "agSetColumnFilter",
      },
      {
        field: "ro_count",
        headerName: isOpcode ? "Operation Count" : "RO Count",
        width: isOpcode ? 200 : 150,
        aggFunc: "sum",
        valueFormatter: integerFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "sales_percent",
        headerName: "Sales %",
        width: 150,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_hours",
        headerName: "Labor Hours",
        width: 160,
        aggFunc: "sum",
        valueFormatter: numberFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_revenue",
        headerName: "Labor Revenue",
        width: 180,
        aggFunc: "sum",
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_rev_per_ro",
        headerName: isOpcode ? "Labor Rev/Op" : "Labor Rev/RO",
        width: isOpcode ? 180 : 170,
        valueGetter: (params: ValueGetterParams) => {
          if (params.node?.group) {
            const totalRevenue = params.node.aggData?.labor_revenue || 0;
            const count = params.node.aggData?.ro_count || 1;
            return totalRevenue / count;
          }
          return params.data?.labor_rev_per_ro || 0;
        },
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_gp_percent",
        headerName: "Labor GP %",
        width: 150,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "parts_revenue",
        headerName: "Parts Revenue",
        width: 180,
        aggFunc: "sum",
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "parts_gp_percent",
        headerName: "Parts GP %",
        width: 150,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "elr",
        headerName: "ELR",
        width: 120,
        valueGetter: (params: ValueGetterParams) => {
          if (params.node?.group) {
            const totalRevenue = params.node.aggData?.labor_revenue || 0;
            const totalHours = params.node.aggData?.labor_hours || 1;
            return totalRevenue / totalHours;
          }
          return params.data?.elr || 0;
        },
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "discount_percent",
        headerName: "Discount %",
        width: 150,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
    ];
  }, [savedReport]);

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      enableRowGroup: true,
      enableValue: true,
    }),
    []
  );

  const autoGroupColumnDef: ColDef = useMemo(
    () => ({
      headerName: "Group",
      minWidth: 250,
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams: {
        suppressCount: false,
      },
    }),
    []
  );

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);

    // Apply saved grouping and column state
    if (savedReport) {
      if (savedReport.grouping && Array.isArray(savedReport.grouping)) {
        params.api.setRowGroupColumns(savedReport.grouping);
      }
      if (savedReport.columnState) {
        params.api.applyColumnState({
          state: savedReport.columnState,
          applyOrder: true,
        });
      }
    }

    // Lock grouping if not in edit mode
    if (!isEditMode) {
      params.api.setGridOption("rowGroupPanelShow", "never");
    }
  };

  // Auto-hide grouped parent columns (like in custom reports)
  const handleRowGroupChanged = useCallback(() => {
    if (gridApi) {
      const rowGroupColumns = gridApi.getRowGroupColumns();

      // Only manage column visibility if grouping is active
      if (rowGroupColumns.length > 0) {
        const detailColumns = [
          "ro_number",
          "ro_date",
          "model",
          "advisor",
          "mileage_band",
          "make",
          "opcode",
          "opcode_description",
        ];

        // Check if any leaf (actual data) rows are visible
        let hasVisibleLeafRows = false;
        gridApi.forEachNodeAfterFilterAndSort((node) => {
          if (!node.group && node.displayed) {
            hasVisibleLeafRows = true;
          }
        });

        // Show columns only if leaf rows are visible, hide otherwise
        gridApi.setColumnsVisible(detailColumns, hasVisibleLeafRows);
      }
    }
  }, [gridApi]);

  useEffect(() => {
    if (gridApi) {
      // Listen for row group changes
      const listener = () => handleRowGroupChanged();
      gridApi.addEventListener("rowGroupOpened", listener);
      gridApi.addEventListener("expandOrCollapseAll", listener);

      // Initial call
      handleRowGroupChanged();

      return () => {
        gridApi.removeEventListener("rowGroupOpened", listener);
        gridApi.removeEventListener("expandOrCollapseAll", listener);
      };
    }
  }, [gridApi, handleRowGroupChanged]);

  // Toggle edit mode
  useEffect(() => {
    if (gridApi) {
      if (isEditMode) {
        gridApi.setGridOption("rowGroupPanelShow", "always");
      } else {
        gridApi.setGridOption("rowGroupPanelShow", "never");
      }
    }
  }, [isEditMode, gridApi]);

  const handleSaveChanges = async () => {
    if (!gridApi || !savedReport) return;

    try {
      const token = await getAuthToken();

      // Get current state
      const groupColumns = gridApi.getRowGroupColumns();
      const grouping = groupColumns.map((col) => col.getColId());
      const columnState = gridApi.getColumnState();
      const filters = {
        datePreset,
        startDate,
        endDate,
        payTypes: selectedPayTypes,
        warrantyEligibility,
      };

      const response = await fetch(`/api/reports/saved/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedName,
          filters,
          grouping,
          columnState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      const result = await response.json();
      setSavedReport(result.data);
      setIsEditMode(false);

      // Show success toast
      setToastMessage("Changes saved successfully!");
      setToastType("success");
      setToastOpen(true);

      // Refresh sidebar to update report name if changed
      window.dispatchEvent(new Event("refreshSavedReports"));

      // Auto-hide toast after 3 seconds
      setTimeout(() => setToastOpen(false), 3000);
    } catch (error: any) {
      console.error("Error saving changes:", error);
      setToastMessage(error.message || "Failed to save changes");
      setToastType("error");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/reports/saved/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      // Show success toast
      setToastMessage("Report deleted successfully!");
      setToastType("success");
      setToastOpen(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/reports/ro-performance-summary");
      }, 1000);
    } catch (error: any) {
      console.error("Error deleting report:", error);
      setToastMessage(error.message || "Failed to delete report");
      setToastType("error");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    }
  };

  const expandAll = () => {
    if (gridApi) {
      gridApi.expandAll();
    }
  };

  const collapseAll = () => {
    if (gridApi) {
      gridApi.collapseAll();
    }
  };

  const exportToCSV = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${savedReport?.name || "report"}-${
          new Date().toISOString().split("T")[0]
        }.csv`,
      });
    }
  };

  const toggleFullscreen = async () => {
    if (!gridContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await gridContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (error || !savedReport) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">
            {error || "Report not found"}
          </p>
        </div>
      </div>
    );
  }

  const filtersLocked = !savedReport.allowFilters && !isEditMode;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          {isEditMode ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="form-input text-2xl md:text-3xl font-bold mb-2"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
              {savedReport.name}
            </h1>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {savedReport.reportType === "custom-ro"
              ? "Custom RO"
              : "Custom Opcode"}{" "}
            •{savedReport.visibility === "public" ? " Public" : " Private"} •
            Created by {savedReport.creator.name}
          </p>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Report
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters - Collapsed by default */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Filters {filtersLocked && "(Locked)"}
          </h3>
          {filtersExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        {filtersExpanded && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Preset
                </label>
                <select
                  value={datePreset}
                  onChange={(e) =>
                    !filtersLocked && handleDatePresetChange(e.target.value)
                  }
                  disabled={filtersLocked}
                  className={`form-select w-full min-h-[42px] ${
                    filtersLocked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="custom">Custom Range</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last60">Last 60 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="monthToDate">Month to Date</option>
                  <option value="previousMonth">Previous Month</option>
                  <option value="yearToDate">Year to Date</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    !filtersLocked && setStartDate(e.target.value)
                  }
                  disabled={filtersLocked}
                  className={`form-input w-full ${
                    filtersLocked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => !filtersLocked && setEndDate(e.target.value)}
                  disabled={filtersLocked}
                  className={`form-input w-full ${
                    filtersLocked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div className="sm:col-span-1">
                <MultiSelectDropdown
                  label="Pay Type"
                  options={[
                    { value: "C", label: "Customer Pay" },
                    { value: "W", label: "Warranty" },
                    { value: "I", label: "Internal" },
                  ]}
                  value={selectedPayTypes}
                  onChange={setSelectedPayTypes}
                  placeholder="Select pay types..."
                  disabled={filtersLocked}
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warranty Eligibility
                </label>
                <select
                  value={warrantyEligibility}
                  onChange={(e) =>
                    !filtersLocked && setWarrantyEligibility(e.target.value)
                  }
                  disabled={filtersLocked}
                  className={`form-select w-full min-h-[42px] ${
                    filtersLocked ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="all">All</option>
                  <option value="yes">Eligible</option>
                  <option value="no">Not Eligible</option>
                  <option value="unset">Unset</option>
                </select>
              </div>
            </div>

            {!filtersLocked && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={fetchData}
                  disabled={dataLoading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
                         flex items-center gap-2 text-sm"
                >
                  {dataLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Apply Filters"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Summary Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                {savedReport?.reportType === "custom-opcode"
                  ? "Total Operations"
                  : "Total ROs"}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {data.length.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Total Labor Revenue
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                $
                {data
                  .reduce((sum, row) => sum + row.labor_revenue, 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Total Parts Revenue
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                $
                {data
                  .reduce((sum, row) => sum + row.parts_revenue, 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Total Labor Hours
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {data
                  .reduce((sum, row) => sum + row.labor_hours, 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Avg ELR</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                $
                {(
                  data.reduce((sum, row) => sum + row.labor_revenue, 0) /
                  data.reduce((sum, row) => sum + row.labor_hours, 0)
                ).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">
                Avg Labor GP %
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {(
                  data.reduce((sum, row) => sum + row.labor_gp_percent, 0) /
                  data.length
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={expandAll}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                   rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          Collapse All
        </button>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                   transition-colors text-sm flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* AG Grid */}
      <div
        ref={gridContainerRef}
        className="w-full relative bg-white dark:bg-gray-900 p-4"
        style={{ height: "700px" }}
      >
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-10 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors shadow-lg flex items-center gap-2"
          title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg border border-gray-200 dark:border-gray-700`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<any>
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            onGridReady={onGridReady}
            onRowGroupOpened={handleRowGroupChanged}
            groupDefaultExpanded={0}
            animateRows={true}
            suppressAggFuncInHeader={true}
            getRowStyle={(params) => {
              const rowGroupColumns = params.api.getRowGroupColumns();
              if (rowGroupColumns.length === 0) {
                return undefined;
              }

              if (!params.node.group) {
                return {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                };
              } else {
                const level = params.node.level || 0;
                const opacity = isDark
                  ? 0.02 + level * 0.015
                  : 0.015 + level * 0.01;
                return {
                  backgroundColor: isDark
                    ? `rgba(255, 255, 255, ${opacity})`
                    : `rgba(0, 0, 0, ${opacity})`,
                };
              }
            }}
            sideBar={{
              toolPanels: [
                {
                  id: "columns",
                  labelDefault: "Columns",
                  labelKey: "columns",
                  iconKey: "columns",
                  toolPanel: "agColumnsToolPanel",
                },
                {
                  id: "filters",
                  labelDefault: "Filters",
                  labelKey: "filters",
                  iconKey: "filter",
                  toolPanel: "agFiltersToolPanel",
                },
              ],
            }}
            theme="legacy"
            loading={dataLoading}
          />
        </div>
      </div>

      {/* RO Details Modal */}
      {selectedRO && currentDealer && (
        <RODetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRO(null);
          }}
          serviceRecordId={selectedRO.serviceRecordId}
          roNumber={selectedRO.roNumber}
          dealerId={currentDealer.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Report?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{savedReport.name}"? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        type={toastType}
        open={toastOpen}
        setOpen={setToastOpen}
        className="fixed top-4 right-4 z-50"
      >
        {toastMessage}
      </Toast>
    </div>
  );
}
