"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { 
  ColDef, 
  GridApi, 
  GridReadyEvent, 
  IServerSideDatasource,
  IServerSideGetRowsParams,
  ServerSideRowModelModule,
  ModuleRegistry
} from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([ServerSideRowModelModule]);

// Order data interface
interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  orderDate: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  priority: "Low" | "Medium" | "High";
  region: string;
  country: string;
}

// Mock server data generator
const generateMockOrders = (startIndex: number, count: number): Order[] => {
  const products = ["Laptop", "Smartphone", "Tablet", "Headphones", "Monitor", "Keyboard", "Mouse", "Speaker"];
  const categories = ["Electronics", "Accessories", "Computers", "Audio"];
  const statuses: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  const priorities: Order["priority"][] = ["Low", "Medium", "High"];
  const regions = ["North America", "Europe", "Asia", "South America", "Africa", "Oceania"];
  const countries = ["USA", "Canada", "Germany", "France", "UK", "Japan", "China", "Australia", "Brazil", "India"];
  const firstNames = ["John", "Jane", "Mike", "Sarah", "David", "Lisa", "Tom", "Emma", "Chris", "Anna"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

  const orders: Order[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = startIndex + i;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = Math.floor(Math.random() * 1000) + 50;
    const totalAmount = quantity * unitPrice;
    const orderDate = new Date(2024, 0, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];

    orders.push({
      id,
      orderNumber: `ORD-${String(id).padStart(6, '0')}`,
      customerName: `${firstName} ${lastName}`,
      customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      product,
      category,
      quantity,
      unitPrice,
      totalAmount,
      orderDate,
      status,
      priority,
      region,
      country
    });
  }

  return orders;
};

// Mock server-side data source
const createServerSideDataSource = (): IServerSideDatasource => {
  return {
    getRows: (params: IServerSideGetRowsParams) => {
      console.log('Requesting rows from server:', params);
      
      // Simulate server delay
      setTimeout(() => {
        const { startRow, endRow, sortModel, filterModel } = params.request;
        const pageSize = endRow - startRow;
        
        // Generate mock data
        let allData = generateMockOrders(0, 10000); // Generate 10k records
        
        // Apply sorting
        if (sortModel.length > 0) {
          const sort = sortModel[0];
          allData.sort((a, b) => {
            const aValue = a[sort.colId as keyof Order];
            const bValue = b[sort.colId as keyof Order];
            
            if (aValue < bValue) return sort.sort === 'asc' ? -1 : 1;
            if (aValue > bValue) return sort.sort === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        // Apply filtering
        Object.keys(filterModel).forEach(key => {
          const filter = filterModel[key];
          if (filter.filterType === 'text') {
            allData = allData.filter(item => 
              String(item[key as keyof Order]).toLowerCase().includes(filter.filter.toLowerCase())
            );
          } else if (filter.filterType === 'number') {
            if (filter.type === 'greaterThan') {
              allData = allData.filter(item => Number(item[key as keyof Order]) > filter.filter);
            } else if (filter.type === 'lessThan') {
              allData = allData.filter(item => Number(item[key as keyof Order]) < filter.filter);
            } else if (filter.type === 'equals') {
              allData = allData.filter(item => Number(item[key as keyof Order]) === filter.filter);
            }
          } else if (filter.filterType === 'set') {
            allData = allData.filter(item => filter.values.includes(item[key as keyof Order]));
          }
        });
        
        // Get the requested page
        const pageData = allData.slice(startRow, endRow);
        
        // Simulate success response
        params.success({
          rowData: pageData,
          rowCount: allData.length
        });
      }, 500); // 500ms delay to simulate network request
    }
  };
};

const ServerSideGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Column definitions
  const columnDefs: ColDef<Order>[] = [
    {
      field: "orderNumber",
      headerName: "Order #",
      width: 120,
      pinned: "left",
      filter: "agTextColumnFilter"
    },
    {
      field: "customerName",
      headerName: "Customer",
      width: 150,
      filter: "agTextColumnFilter"
    },
    {
      field: "customerEmail",
      headerName: "Email",
      width: 200,
      filter: "agTextColumnFilter"
    },
    {
      field: "product",
      headerName: "Product",
      width: 120,
      filter: "agSetColumnFilter"
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      filter: "agSetColumnFilter"
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 80,
      filter: "agNumberColumnFilter",
      cellStyle: { textAlign: "right" }
    },
    {
      field: "unitPrice",
      headerName: "Unit Price",
      width: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      cellStyle: { textAlign: "right" }
    },
    {
      field: "totalAmount",
      headerName: "Total",
      width: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      cellStyle: { textAlign: "right" }
    },
    {
      field: "orderDate",
      headerName: "Order Date",
      width: 120,
      filter: "agDateColumnFilter"
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      filter: "agSetColumnFilter",
      cellRenderer: (params: any) => {
        const status = params.value;
        const statusConfig = {
          Pending: "bg-yellow-100 text-yellow-800",
          Processing: "bg-blue-100 text-blue-800",
          Shipped: "bg-purple-100 text-purple-800",
          Delivered: "bg-green-100 text-green-800",
          Cancelled: "bg-red-100 text-red-800"
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig]}">${status}</span>`;
      }
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      filter: "agSetColumnFilter",
      cellRenderer: (params: any) => {
        const priority = params.value;
        const priorityConfig = {
          Low: "bg-gray-100 text-gray-800",
          Medium: "bg-yellow-100 text-yellow-800",
          High: "bg-red-100 text-red-800"
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[priority as keyof typeof priorityConfig]}">${priority}</span>`;
      }
    },
    {
      field: "region",
      headerName: "Region",
      width: 130,
      filter: "agSetColumnFilter"
    },
    {
      field: "country",
      headerName: "Country",
      width: 100,
      filter: "agSetColumnFilter"
    }
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    const dataSource = createServerSideDataSource();
    params.api.setGridOption('serverSideDatasource', dataSource);
  };

  const onLoadingChanged = useCallback((loading: boolean) => {
    setLoading(loading);
  }, []);

  const refreshData = () => {
    if (gridApi) {
      gridApi.refreshServerSide();
    }
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "orders-server-side.csv"
      });
    }
  };

  const clearFilters = () => {
    if (gridApi) {
      gridApi.setFilterModel(null);
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={refreshData}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            loading 
              ? "bg-gray-400 text-gray-200 cursor-not-allowed" 
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
        <button
          onClick={exportToCsv}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            loading 
              ? "bg-gray-400 text-gray-200 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Export CSV
        </button>
        <button
          onClick={clearFilters}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-colors ${
            loading 
              ? "bg-gray-400 text-gray-200 cursor-not-allowed" 
              : "bg-gray-600 text-white hover:bg-gray-700"
          }`}
        >
          Clear Filters
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-md">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            Loading data from server...
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="w-full h-96">
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<Order>
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onLoadingChanged={onLoadingChanged}
            rowModelType="serverSide"
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            cacheBlockSize={20}
            maxBlocksInCache={10}
            theme="legacy"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Server-Side Features:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Server-Side Row Model:</strong> Handles large datasets efficiently</li>
          <li>• <strong>Pagination:</strong> Built-in pagination with configurable page sizes</li>
          <li>• <strong>Sorting:</strong> Server-side sorting with visual indicators</li>
          <li>• <strong>Filtering:</strong> Server-side filtering for all column types</li>
          <li>• <strong>Loading States:</strong> Visual feedback during data loading</li>
          <li>• <strong>Cache Management:</strong> Efficient data caching and memory management</li>
          <li>• <strong>Infinite Scrolling:</strong> Smooth scrolling through large datasets</li>
        </ul>
      </div>
    </div>
  );
};

export default ServerSideGrid;
