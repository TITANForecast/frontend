"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Plus,
  Save,
} from "lucide-react";
import { initializeAgGridLicense } from "@/lib/ag-charts-license";
import RODetailsModal from "@/app/(default)/dealer-settings/ro-details-modal";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import SaveReportModal, {
  SaveReportConfig,
} from "@/components/save-report-modal";
import Toast from "@/components/toast";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// Initialize AG Grid Enterprise license
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

export default function ROPerformanceSummary() {
  const { currentDealer, getAuthToken } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ROPerformanceData[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Filter states
  const [datePreset, setDatePreset] = useState<string>("custom");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });
  const [selectedPayTypes, setSelectedPayTypes] = useState<string[]>([
    "C",
    "W",
    "I",
  ]);
  const [warrantyEligibility, setWarrantyEligibility] = useState<string>("all");
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showGroupMenu, setShowGroupMenu] = useState<boolean>(false);
  const [selectedRO, setSelectedRO] = useState<{
    serviceRecordId: string;
    roNumber: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaveReportModalOpen, setIsSaveReportModalOpen] =
    useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const gridContainerRef = React.useRef<HTMLDivElement>(null);
  const groupMenuRef = React.useRef<HTMLDivElement>(null);

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

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentDealer?.id) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        dealerId: currentDealer.id,
        startDate,
        endDate,
        payTypes: selectedPayTypes.join(","),
        warrantyEligibility,
      });

      const response = await fetch(
        `/api/reports/ro-performance-summary?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching RO Performance Summary:", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentDealer,
    startDate,
    endDate,
    selectedPayTypes,
    warrantyEligibility,
    getAuthToken,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle date preset changes
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
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

  // Currency formatter
  const currencyFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "$0.00";
    return `$${Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Number formatter
  const numberFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0.00";
    return Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Percent formatter
  const percentFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0.0%";
    return `${Number(params.value).toFixed(1)}%`;
  };

  // Integer formatter
  const integerFormatter = (params: ValueFormatterParams) => {
    if (params.value == null || isNaN(params.value)) return "0";
    return Number(params.value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Column definitions
  const columnDefs: ColDef<ROPerformanceData>[] = useMemo(
    () => [
      // RO Details (groupable by default)
      {
        field: "ro_number",
        headerName: "RO Number",
        width: 180,
        filter: "agTextColumnFilter",
        enableRowGroup: true,
        cellRenderer: (params: ICellRendererParams<ROPerformanceData>) => {
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

      // Groupable Columns
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

      // Metrics with Aggregation
      {
        field: "ro_count",
        headerName: "RO Count",
        width: 150,
        aggFunc: "sum",
        valueFormatter: integerFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "sales_percent",
        headerName: "Sales %",
        width: 150,
        aggFunc: "sum",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_hours",
        headerName: "Labor Hours",
        width: 180,
        aggFunc: "sum",
        valueFormatter: numberFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_revenue",
        headerName: "Labor Revenue",
        width: 200,
        aggFunc: "sum",
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_rev_per_ro",
        headerName: "Labor Rev/RO",
        width: 200,
        valueGetter: (params: ValueGetterParams) => {
          // For aggregated rows, calculate from aggregated values
          if (params.node?.group) {
            const laborRevenue = params.node.aggData?.labor_revenue || 0;
            const roCount = params.node.aggData?.ro_count || 1;
            return laborRevenue / roCount;
          }
          return params.data?.labor_rev_per_ro || 0;
        },
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "labor_gp_percent",
        headerName: "Labor GP %",
        width: 180,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "parts_revenue",
        headerName: "Parts Revenue",
        width: 200,
        aggFunc: "sum",
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "parts_gp_percent",
        headerName: "Parts GP %",
        width: 180,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "elr",
        headerName: "ELR",
        width: 150,
        valueGetter: (params: ValueGetterParams) => {
          // For aggregated rows, calculate from aggregated values
          if (params.node?.group) {
            const laborRevenue = params.node.aggData?.labor_revenue || 0;
            const laborHours = params.node.aggData?.labor_hours || 1;
            return laborRevenue / laborHours;
          }
          return params.data?.elr || 0;
        },
        valueFormatter: currencyFormatter,
        cellStyle: { textAlign: "right" },
      },
      {
        field: "discount_percent",
        headerName: "Discount %",
        width: 180,
        aggFunc: "avg",
        valueFormatter: percentFormatter,
        cellStyle: { textAlign: "right" },
      },
    ],
    []
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
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
      comparator: (valueA, valueB, nodeA, nodeB) => {
        // Sort groups by RO Count descending (high to low)
        const roCountA = nodeA?.aggData?.ro_count || 0;
        const roCountB = nodeB?.aggData?.ro_count || 0;
        // Return positive when A > B to put higher values first (descending)
        // Flipped from roCountB - roCountA to fix reversed order
        return roCountA - roCountB;
      },
    }),
    []
  );

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  // Auto-sort groups by RO count descending when grouping changes
  const onColumnRowGroupChanged = useCallback(() => {
    if (gridApi) {
      // Check if any grouping is active
      const rowGroupColumns = gridApi.getRowGroupColumns();

      // Columns to hide when grouping is active (detail columns with no data at group level)
      const detailColumns = [
        "ro_number",
        "ro_date",
        "model",
        "advisor",
        "mileage_band",
        "make",
      ];

      if (rowGroupColumns.length > 0) {
        // Grouping is active - hide detail columns
        gridApi.setColumnsVisible(detailColumns, false);

        // Use setTimeout to ensure grouping is complete before sorting
        setTimeout(() => {
          // Apply sort on the auto group column to trigger the comparator
          // The comparator will handle the descending order (high to low)
          const autoGroupCol = gridApi.getColumn("ag-Grid-AutoColumn");
          if (autoGroupCol) {
            // Force refresh to apply comparator sorting
            gridApi.refreshClientSideRowModel("sort");
          }
        }, 0);
      } else {
        // No grouping - show all detail columns
        gridApi.setColumnsVisible(detailColumns, true);
      }
    }
  }, [gridApi]);

  // Handle row expansion/collapse to show/hide detail columns
  const onRowGroupOpened = useCallback(() => {
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
        ];

        // Check if any leaf (actual data) rows are visible
        // This ensures columns only show when expanded all the way to the data level
        let hasVisibleLeafRows = false;
        gridApi.forEachNodeAfterFilterAndSort((node) => {
          // If node is displayed and not a group, it's a visible leaf row
          if (!node.group && node.displayed) {
            hasVisibleLeafRows = true;
          }
        });

        // Show columns only if leaf rows are visible, hide otherwise
        gridApi.setColumnsVisible(detailColumns, hasVisibleLeafRows);
      }
    }
  }, [gridApi]);

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
        fileName: `ro-performance-summary-${
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

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handlePayTypeChange = (payType: string) => {
    setSelectedPayTypes((prev) =>
      prev.includes(payType)
        ? prev.filter((pt) => pt !== payType)
        : [...prev, payType]
    );
  };

  // Groupable columns definition
  const groupableColumns = [
    { field: "ro_number", label: "RO Number" },
    { field: "make", label: "Make" },
    { field: "model", label: "Model" },
    { field: "advisor", label: "Advisor" },
    { field: "mileage_band", label: "Mileage Band" },
  ];

  const addColumnToGroup = (field: string) => {
    if (gridApi) {
      const currentGroups = gridApi.getRowGroupColumns();
      const isAlreadyGrouped = currentGroups.some(
        (col) => col.getColId() === field
      );

      if (!isAlreadyGrouped) {
        const allGroupFields = [
          ...currentGroups.map((col) => col.getColId()),
          field,
        ];
        gridApi.setRowGroupColumns(allGroupFields);
      }

      setShowGroupMenu(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupMenuRef.current &&
        !groupMenuRef.current.contains(event.target as Node)
      ) {
        setShowGroupMenu(false);
      }
    };

    if (showGroupMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGroupMenu]);

  // Save report functionality
  const handleSaveReport = async (config: SaveReportConfig) => {
    if (!gridApi || !currentDealer) return;

    try {
      const token = await getAuthToken();

      // Get current grouping state
      const groupColumns = gridApi.getRowGroupColumns();
      const grouping = groupColumns.map((col) => col.getColId());

      // Get column state
      const columnState = gridApi.getColumnState();

      // Prepare filters
      const filters = {
        datePreset,
        startDate,
        endDate,
        payTypes: selectedPayTypes,
        warrantyEligibility,
      };

      const response = await fetch("/api/reports/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: config.name,
          reportType: "custom-ro",
          visibility: config.visibility,
          allowFilters: config.allowFilters,
          filters,
          grouping,
          columnState,
          dealerId: currentDealer.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save report");
      }

      // Show success toast
      setToastMessage("Report saved successfully!");
      setToastType("success");
      setToastOpen(true);

      // Refresh sidebar to show new report
      window.dispatchEvent(new Event("refreshSavedReports"));

      // Auto-hide toast after 3 seconds
      setTimeout(() => setToastOpen(false), 3000);
    } catch (error: any) {
      console.error("Error saving report:", error);
      setToastMessage(error.message || "Failed to save report");
      setToastType("error");
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
      throw error;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Custom RO
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Analyze repair orders with flexible grouping by make, model, advisor,
          and mileage bands
        </p>
      </div>

      {/* Instructions - Collapsible */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
        <button
          onClick={() => setInstructionsExpanded(!instructionsExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg"
        >
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            💡 How to Use Grouping
          </h3>
          {instructionsExpanded ? (
            <ChevronUp className="w-5 h-5 text-blue-900 dark:text-blue-100" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-900 dark:text-blue-100" />
          )}
        </button>
        {instructionsExpanded && (
          <div className="px-4 pb-4">
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>
                • Drag column headers (Make, Model, Advisor, Mileage Band) to
                the group area above the grid
              </li>
              <li>
                • Create multi-level grouping by dragging multiple columns
                (e.g., Advisor → Make → Model)
              </li>
              <li>
                • Each row represents a single RO with aggregated metrics from
                all its operations
              </li>
              <li>
                • Metrics will automatically aggregate when grouped (sum for
                counts/revenue, weighted average for percentages)
              </li>
              <li>• Click expand/collapse buttons to view group details</li>
              <li>
                • Use the sidebar (columns icon) to show/hide columns and manage
                filters
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Preset */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="form-select w-full min-h-[42px]"
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

          {/* Date Range */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              disabled={datePreset !== "custom"}
              className={`form-input w-full ${
                datePreset !== "custom" ? "opacity-50 cursor-not-allowed" : ""
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
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              disabled={datePreset !== "custom"}
              className={`form-input w-full ${
                datePreset !== "custom" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Pay Type */}
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
            />
          </div>

          {/* Warranty Eligibility */}
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warranty Eligibility
            </label>
            <select
              value={warrantyEligibility}
              onChange={(e) => setWarrantyEligibility(e.target.value)}
              className="form-select w-full min-h-[42px]"
            >
              <option value="all">All</option>
              <option value="yes">Eligible</option>
              <option value="no">Not Eligible</option>
              <option value="unset">Unset</option>
            </select>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Apply Filters"
            )}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Summary Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Total ROs</div>
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
        <button
          onClick={() => setIsSaveReportModalOpen(true)}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 
                   transition-colors text-sm flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Report
        </button>
      </div>

      {/* AG Grid */}
      <div
        ref={gridContainerRef}
        className="w-full relative bg-white dark:bg-gray-900 p-4"
        style={{ height: "700px" }}
      >
        {/* Add Group Column Button */}
        <div className="absolute top-6 left-6 z-10" ref={groupMenuRef}>
          <button
            onClick={() => setShowGroupMenu(!showGroupMenu)}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     transition-colors shadow-lg flex items-center gap-2"
            title="Add column to grouping"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showGroupMenu && (
            <div
              className="absolute top-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                          border border-gray-200 dark:border-gray-700 py-2 min-w-[200px] z-20"
            >
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Add to Group
              </div>
              {groupableColumns.map((col) => {
                const isGrouped = gridApi
                  ?.getRowGroupColumns()
                  .some((c) => c.getColId() === col.field);
                return (
                  <button
                    key={col.field}
                    onClick={() => addColumnToGroup(col.field)}
                    disabled={isGrouped}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors
                      ${
                        isGrouped
                          ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    {col.label}
                    {isGrouped && (
                      <span className="ml-2 text-xs">(grouped)</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fullscreen Button - Floating inside grid */}
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
          style={{
            height: "100%",
            width: "100%",
            overflowX: "scroll",
            overflowY: "auto",
          }}
        >
          <AgGridReact<ROPerformanceData>
            rowData={data}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            onGridReady={onGridReady}
            onColumnRowGroupChanged={onColumnRowGroupChanged}
            onRowGroupOpened={onRowGroupOpened}
            groupDefaultExpanded={0}
            animateRows={true}
            rowGroupPanelShow="always"
            suppressAggFuncInHeader={true}
            suppressColumnVirtualisation={false}
            getRowStyle={(params) => {
              // Check if grouping is active
              const rowGroupColumns = params.api.getRowGroupColumns();
              if (rowGroupColumns.length === 0) {
                // No grouping - return undefined for transparent/normal background
                return undefined;
              }

              if (!params.node.group) {
                // Leaf rows (actual data rows) - lightest background
                return {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                };
              } else {
                // Group rows - progressively lighter based on depth
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
                  toolPanelParams: {
                    suppressRowGroups: false,
                    suppressValues: false,
                    suppressPivots: true,
                  },
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
            loading={loading}
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

      {/* Save Report Modal */}
      <SaveReportModal
        isOpen={isSaveReportModalOpen}
        onClose={() => setIsSaveReportModalOpen(false)}
        onSave={handleSaveReport}
        reportType="custom-ro"
      />

      {/* Toast Notification */}
      <Toast
        type={toastType}
        open={toastOpen}
        setOpen={setToastOpen}
        className="fixed bottom-4 right-4 z-50"
      >
        {toastMessage}
      </Toast>
    </div>
  );
}
