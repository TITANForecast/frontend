"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import {
  AllCommunityModule,
  ModuleRegistry,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
} from "ag-grid-enterprise";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([
  AllCommunityModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  SetFilterModule,
]);

// Financial data interface
interface FinancialData {
  id: number;
  symbol: string;
  company: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  beta: number;
  high52: number;
  low52: number;
  lastUpdated: string;
}

// Sample financial data
const financialData: FinancialData[] = [
  {
    id: 1,
    symbol: "AAPL",
    company: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    marketCap: 3000000000000,
    price: 175.43,
    change: 2.15,
    changePercent: 1.24,
    volume: 45000000,
    pe: 28.5,
    eps: 6.15,
    dividend: 0.96,
    yield: 0.55,
    beta: 1.2,
    high52: 198.23,
    low52: 124.17,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 2,
    symbol: "MSFT",
    company: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software",
    marketCap: 2800000000000,
    price: 378.85,
    change: -1.25,
    changePercent: -0.33,
    volume: 25000000,
    pe: 32.1,
    eps: 11.8,
    dividend: 3.0,
    yield: 0.79,
    beta: 0.9,
    high52: 384.3,
    low52: 309.45,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 3,
    symbol: "GOOGL",
    company: "Alphabet Inc.",
    sector: "Technology",
    industry: "Internet",
    marketCap: 1800000000000,
    price: 142.56,
    change: 3.42,
    changePercent: 2.46,
    volume: 18000000,
    pe: 25.8,
    eps: 5.52,
    dividend: 0.0,
    yield: 0.0,
    beta: 1.1,
    high52: 151.55,
    low52: 102.21,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 4,
    symbol: "AMZN",
    company: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    industry: "E-commerce",
    marketCap: 1500000000000,
    price: 155.23,
    change: -0.87,
    changePercent: -0.56,
    volume: 32000000,
    pe: 45.2,
    eps: 3.43,
    dividend: 0.0,
    yield: 0.0,
    beta: 1.3,
    high52: 170.83,
    low52: 101.15,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 5,
    symbol: "TSLA",
    company: "Tesla Inc.",
    sector: "Consumer Discretionary",
    industry: "Electric Vehicles",
    marketCap: 800000000000,
    price: 248.42,
    change: 12.35,
    changePercent: 5.22,
    volume: 75000000,
    pe: 65.8,
    eps: 3.78,
    dividend: 0.0,
    yield: 0.0,
    beta: 2.1,
    high52: 299.29,
    low52: 138.8,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 6,
    symbol: "JPM",
    company: "JPMorgan Chase & Co.",
    sector: "Financial Services",
    industry: "Banking",
    marketCap: 450000000000,
    price: 168.92,
    change: 1.45,
    changePercent: 0.87,
    volume: 12000000,
    pe: 11.2,
    eps: 15.08,
    dividend: 4.0,
    yield: 2.37,
    beta: 1.0,
    high52: 182.63,
    low52: 135.19,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 7,
    symbol: "JNJ",
    company: "Johnson & Johnson",
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    marketCap: 420000000000,
    price: 158.67,
    change: -0.23,
    changePercent: -0.14,
    volume: 8000000,
    pe: 15.8,
    eps: 10.04,
    dividend: 4.76,
    yield: 3.0,
    beta: 0.7,
    high52: 175.96,
    low52: 152.11,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
  {
    id: 8,
    symbol: "V",
    company: "Visa Inc.",
    sector: "Financial Services",
    industry: "Payment Processing",
    marketCap: 520000000000,
    price: 245.78,
    change: 2.89,
    changePercent: 1.19,
    volume: 6000000,
    pe: 35.2,
    eps: 6.98,
    dividend: 1.8,
    yield: 0.73,
    beta: 0.9,
    high52: 290.96,
    low52: 201.12,
    lastUpdated: "2024-01-15T16:00:00Z",
  },
];

const ColumnMenuGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

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

  // Custom change renderer with color coding
  const ChangeRenderer = (params: any) => {
    const { change, changePercent } = params.data || {};
    const isPositive = change >= 0;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const bgClass = isPositive ? "bg-green-100" : "bg-red-100";

    return (
      <div className="flex items-center space-x-2 h-full">
        <span className={`font-semibold ${colorClass}`}>
          {isPositive ? "+" : ""}
          {change.toFixed(2)}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${bgClass} ${colorClass}`}
        >
          {isPositive ? "+" : ""}
          {changePercent.toFixed(2)}%
        </span>
      </div>
    );
  };

  // Custom market cap formatter
  const MarketCapFormatter = (params: any) => {
    const value = params.value;
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Custom volume formatter
  const VolumeFormatter = (params: any) => {
    const value = params.value;
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  // Column definitions with tooltips and column menu
  const columnDefs: ColDef<FinancialData>[] = [
    {
      field: "symbol",
      headerName: "Symbol",
      width: 100,
      pinned: "left",
      filter: "agTextColumnFilter",
      tooltipField: "symbol",
      headerTooltip: "Stock ticker symbol",
    },
    {
      field: "company",
      headerName: "Company",
      width: 200,
      filter: "agTextColumnFilter",
      tooltipField: "company",
      headerTooltip: "Company name",
    },
    {
      field: "sector",
      headerName: "Sector",
      width: 150,
      filter: "agTextColumnFilter",
      tooltipField: "sector",
      headerTooltip: "Business sector classification",
    },
    {
      field: "industry",
      headerName: "Industry",
      width: 180,
      filter: "agTextColumnFilter",
      tooltipField: "industry",
      headerTooltip: "Specific industry within the sector",
    },
    {
      field: "marketCap",
      headerName: "Market Cap",
      width: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: MarketCapFormatter,
      tooltipValueGetter: (params) => `$${params.value.toLocaleString()}`,
      headerTooltip: "Total market capitalization",
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      tooltipField: "price",
      headerTooltip: "Current stock price",
    },
    {
      field: "change",
      headerName: "Change",
      width: 150,
      filter: "agNumberColumnFilter",
      cellRenderer: ChangeRenderer,
      tooltipValueGetter: (params) =>
        `${params.data?.change || 0} (${params.data?.changePercent || 0}%)`,
      headerTooltip: "Price change from previous close",
    },
    {
      field: "volume",
      headerName: "Volume",
      width: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: VolumeFormatter,
      tooltipValueGetter: (params) => params.value.toLocaleString(),
      headerTooltip: "Trading volume",
    },
    {
      field: "pe",
      headerName: "P/E",
      width: 80,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => params.value.toFixed(1),
      tooltipField: "pe",
      headerTooltip: "Price-to-earnings ratio",
    },
    {
      field: "eps",
      headerName: "EPS",
      width: 80,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      tooltipField: "eps",
      headerTooltip: "Earnings per share",
    },
    {
      field: "dividend",
      headerName: "Dividend",
      width: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) =>
        params.value > 0 ? `$${params.value.toFixed(2)}` : "N/A",
      tooltipField: "dividend",
      headerTooltip: "Annual dividend per share",
    },
    {
      field: "yield",
      headerName: "Yield",
      width: 80,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) =>
        params.value > 0 ? `${params.value.toFixed(2)}%` : "N/A",
      tooltipField: "yield",
      headerTooltip: "Dividend yield percentage",
    },
    {
      field: "beta",
      headerName: "Beta",
      width: 80,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => params.value.toFixed(2),
      tooltipField: "beta",
      headerTooltip: "Stock volatility relative to market",
    },
    {
      field: "high52",
      headerName: "52W High",
      width: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      tooltipField: "high52",
      headerTooltip: "52-week high price",
    },
    {
      field: "low52",
      headerName: "52W Low",
      width: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      tooltipField: "low52",
      headerTooltip: "52-week low price",
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      width: 150,
      filter: "agDateColumnFilter",
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString();
      },
      tooltipField: "lastUpdated",
      headerTooltip: "Last data update timestamp",
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    menuTabs: ["generalMenuTab", "filterMenuTab", "columnsMenuTab"],
    tooltipComponent: "defaultTooltipComponent",
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "financial-data.csv",
      });
    }
  };

  const resetColumns = () => {
    if (gridApi) {
      gridApi.resetColumnState();
    }
  };

  const autoSizeColumns = () => {
    if (gridApi) {
      gridApi.autoSizeAllColumns();
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={exportToCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Export CSV
        </button>
        <button
          onClick={resetColumns}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Reset Columns
        </button>
        <button
          onClick={autoSizeColumns}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Auto Size Columns
        </button>
      </div>

      {/* Grid */}
      <div className="w-full h-96">
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<FinancialData>
            rowData={financialData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            enableRangeSelection={true}
            enableCharts={true}
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
              defaultToolPanel: "columns",
            }}
            tooltipShowDelay={500}
            tooltipHideDelay={200}
            theme="legacy"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Column Menu & Tooltip Features:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>
            • <strong>Column Menu:</strong> Right-click column headers for
            sorting, filtering, and column management
          </li>
          <li>
            • <strong>Tooltips:</strong> Hover over cells and headers for
            detailed information
          </li>
          <li>
            • <strong>Side Panel:</strong> Use the side panel to manage columns
            and filters
          </li>
          <li>
            • <strong>Range Selection:</strong> Select ranges of cells for
            analysis
          </li>
          <li>
            • <strong>Column Resizing:</strong> Drag column borders to resize
          </li>
          <li>
            • <strong>Column Pinning:</strong> Pin important columns to the left
          </li>
          <li>
            • <strong>Custom Formatters:</strong> Special formatting for
            financial data
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ColumnMenuGrid;
