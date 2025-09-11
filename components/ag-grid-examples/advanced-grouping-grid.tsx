"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { 
  AllCommunityModule, 
  ModuleRegistry,
  ClientSideRowModelModule 
} from "ag-grid-community";
import { 
  RowGroupingModule, 
  RowGroupingPanelModule,
  SetFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule
} from "ag-grid-enterprise";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
  MenuModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule
]);

// Sales data interface
interface SalesData {
  id: number;
  region: string;
  country: string;
  city: string;
  product: string;
  category: string;
  sales: number;
  profit: number;
  quantity: number;
  date: string;
  salesperson: string;
}

// Sample sales data
const salesData: SalesData[] = [
  {
    id: 1,
    region: "North America",
    country: "USA",
    city: "New York",
    product: "Laptop",
    category: "Electronics",
    sales: 2500,
    profit: 500,
    quantity: 1,
    date: "2024-01-15",
    salesperson: "Alice Johnson"
  },
  {
    id: 2,
    region: "North America",
    country: "USA",
    city: "Los Angeles",
    product: "Smartphone",
    category: "Electronics",
    sales: 800,
    profit: 200,
    quantity: 1,
    date: "2024-01-16",
    salesperson: "Bob Smith"
  },
  {
    id: 3,
    region: "Europe",
    country: "Germany",
    city: "Berlin",
    product: "Tablet",
    category: "Electronics",
    sales: 1200,
    profit: 300,
    quantity: 1,
    date: "2024-01-17",
    salesperson: "Carlos Rodriguez"
  },
  {
    id: 4,
    region: "Europe",
    country: "France",
    city: "Paris",
    product: "Headphones",
    category: "Accessories",
    sales: 150,
    profit: 50,
    quantity: 2,
    date: "2024-01-18",
    salesperson: "Diana Prince"
  },
  {
    id: 5,
    region: "Asia",
    country: "Japan",
    city: "Tokyo",
    product: "Laptop",
    category: "Electronics",
    sales: 2800,
    profit: 600,
    quantity: 1,
    date: "2024-01-19",
    salesperson: "Elena Tanaka"
  },
  {
    id: 6,
    region: "Asia",
    country: "China",
    city: "Shanghai",
    product: "Smartphone",
    category: "Electronics",
    sales: 900,
    profit: 180,
    quantity: 1,
    date: "2024-01-20",
    salesperson: "Frank Chen"
  },
  {
    id: 7,
    region: "North America",
    country: "Canada",
    city: "Toronto",
    product: "Monitor",
    category: "Electronics",
    sales: 400,
    profit: 100,
    quantity: 1,
    date: "2024-01-21",
    salesperson: "Grace Lee"
  },
  {
    id: 8,
    region: "Europe",
    country: "UK",
    city: "London",
    product: "Keyboard",
    category: "Accessories",
    sales: 80,
    profit: 20,
    quantity: 1,
    date: "2024-01-22",
    salesperson: "Henry Wilson"
  },
  {
    id: 9,
    region: "Asia",
    country: "India",
    city: "Mumbai",
    product: "Mouse",
    category: "Accessories",
    sales: 25,
    profit: 5,
    quantity: 1,
    date: "2024-01-23",
    salesperson: "Isha Patel"
  },
  {
    id: 10,
    region: "North America",
    country: "USA",
    city: "Chicago",
    product: "Laptop",
    category: "Electronics",
    sales: 2600,
    profit: 520,
    quantity: 1,
    date: "2024-01-24",
    salesperson: "Jack Davis"
  }
];

const AdvancedGroupingGrid: React.FC = () => {
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

  // Column definitions with grouping
  const columnDefs: ColDef<SalesData>[] = [
    {
      field: "region",
      headerName: "Region",
      rowGroup: true,
      hide: true,
      filter: "agSetColumnFilter"
    },
    {
      field: "country",
      headerName: "Country",
      rowGroup: true,
      hide: true,
      filter: "agSetColumnFilter"
    },
    {
      field: "city",
      headerName: "City",
      width: 120,
      filter: "agTextColumnFilter"
    },
    {
      field: "product",
      headerName: "Product",
      width: 150,
      filter: "agSetColumnFilter"
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      filter: "agSetColumnFilter"
    },
    {
      field: "salesperson",
      headerName: "Salesperson",
      width: 150,
      filter: "agTextColumnFilter"
    },
    {
      field: "sales",
      headerName: "Sales",
      width: 120,
      aggFunc: "sum",
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      cellStyle: { textAlign: "right" }
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 120,
      aggFunc: "sum",
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
      cellStyle: { textAlign: "right" }
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 100,
      aggFunc: "sum",
      cellStyle: { textAlign: "right" }
    },
    {
      field: "date",
      headerName: "Date",
      width: 120,
      filter: "agDateColumnFilter"
    }
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true
  };

  const autoGroupColumnDef: ColDef = {
    headerName: "Group",
    minWidth: 200,
    cellRenderer: "agGroupCellRenderer",
    cellRendererParams: {
      suppressCount: false,
      checkbox: true
    }
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
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

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "sales-data-grouped.csv"
      });
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={expandAll}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
        >
          Collapse All
        </button>
        <button
          onClick={exportToCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Export CSV
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
          <AgGridReact<SalesData>
            rowData={salesData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            onGridReady={onGridReady}
            groupDefaultExpanded={1}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            sideBar={{
              toolPanels: [
                {
                  id: "columns",
                  labelDefault: "Columns",
                  labelKey: "columns",
                  iconKey: "columns",
                  toolPanel: "agColumnsToolPanel"
                },
                {
                  id: "filters",
                  labelDefault: "Filters",
                  labelKey: "filters",
                  iconKey: "filter",
                  toolPanel: "agFiltersToolPanel"
                }
              ]
            }}
            theme="legacy"
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedGroupingGrid;
