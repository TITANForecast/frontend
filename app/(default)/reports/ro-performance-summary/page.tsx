"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ValueFormatterParams,
  ValueGetterParams,
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
import { Loader2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { initializeAgGridLicense } from "@/lib/ag-charts-license";

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
        pinned: "left",
        enableRowGroup: true,
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

  const handlePayTypeChange = (payType: string) => {
    setSelectedPayTypes((prev) =>
      prev.includes(payType)
        ? prev.filter((pt) => pt !== payType)
        : [...prev, payType]
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          RO Performance Summary
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Pay Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pay Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPayTypes.includes("C")}
                  onChange={() => handlePayTypeChange("C")}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Customer Pay
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPayTypes.includes("W")}
                  onChange={() => handlePayTypeChange("W")}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Warranty
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPayTypes.includes("I")}
                  onChange={() => handlePayTypeChange("I")}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Internal
                </span>
              </label>
            </div>
          </div>

          {/* Warranty Eligibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Warranty Eligibility
            </label>
            <select
              value={warrantyEligibility}
              onChange={(e) => setWarrantyEligibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="yes">Eligible</option>
              <option value="no">Not Eligible</option>
              <option value="unset">Unset</option>
            </select>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="mt-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 
                     disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
                     flex items-center gap-2"
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
      </div>

      {/* AG Grid */}
      <div className="w-full" style={{ height: "700px" }}>
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
    </div>
  );
}
