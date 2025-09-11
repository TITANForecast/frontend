"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

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

// Generate sample data
const generateOrders = (count: number): Order[] => {
  const products = [
    "Laptop",
    "Smartphone",
    "Tablet",
    "Headphones",
    "Monitor",
    "Keyboard",
    "Mouse",
    "Speaker",
  ];
  const categories = ["Electronics", "Accessories", "Computers", "Audio"];
  const statuses: Order["status"][] = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  const priorities: Order["priority"][] = ["Low", "Medium", "High"];
  const regions = [
    "North America",
    "Europe",
    "Asia",
    "South America",
    "Africa",
    "Oceania",
  ];
  const countries = [
    "USA",
    "Canada",
    "Germany",
    "France",
    "UK",
    "Japan",
    "China",
    "Australia",
    "Brazil",
    "India",
  ];
  const firstNames = [
    "John",
    "Jane",
    "Mike",
    "Sarah",
    "David",
    "Lisa",
    "Tom",
    "Emma",
    "Chris",
    "Anna",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];

  const orders: Order[] = [];

  for (let i = 0; i < count; i++) {
    const id = i + 1;
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = Math.floor(Math.random() * 1000) + 50;
    const totalAmount = quantity * unitPrice;
    const orderDate = new Date(2024, 0, Math.floor(Math.random() * 31) + 1)
      .toISOString()
      .split("T")[0];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];

    orders.push({
      id,
      orderNumber: `ORD-${String(id).padStart(6, "0")}`,
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
      country,
    });
  }

  return orders;
};

const SimplePaginationGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [allData, setAllData] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);

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

  // Generate data on component mount
  useEffect(() => {
    const data = generateOrders(1000); // Generate 1000 records
    setAllData(data);
    setTotalPages(Math.ceil(data.length / pageSize));
  }, [pageSize]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allData.slice(startIndex, endIndex);
  };

  // Column definitions
  const columnDefs: ColDef<Order>[] = [
    {
      field: "orderNumber",
      headerName: "Order #",
      width: 120,
      pinned: "left",
      filter: "agTextColumnFilter",
    },
    {
      field: "customerName",
      headerName: "Customer",
      width: 150,
      filter: "agTextColumnFilter",
    },
    {
      field: "customerEmail",
      headerName: "Email",
      width: 200,
      filter: "agTextColumnFilter",
    },
    {
      field: "product",
      headerName: "Product",
      width: 120,
      filter: "agTextColumnFilter",
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      filter: "agTextColumnFilter",
    },
    {
      field: "quantity",
      headerName: "Qty",
      width: 80,
      filter: "agNumberColumnFilter",
      cellStyle: { textAlign: "right" },
    },
    {
      field: "unitPrice",
      headerName: "Unit Price",
      width: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      cellStyle: { textAlign: "right" },
    },
    {
      field: "totalAmount",
      headerName: "Total",
      width: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
      cellStyle: { textAlign: "right" },
    },
    {
      field: "orderDate",
      headerName: "Order Date",
      width: 120,
      filter: "agDateColumnFilter",
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => {
        const status = params.value;
        const statusConfig = {
          Pending: "bg-yellow-100 text-yellow-800",
          Processing: "bg-blue-100 text-blue-800",
          Shipped: "bg-purple-100 text-purple-800",
          Delivered: "bg-green-100 text-green-800",
          Cancelled: "bg-red-100 text-red-800",
        };
        return (
          <div className="h-full flex items-center">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium ${
          statusConfig[status as keyof typeof statusConfig]
        }"
            >
              {status}
            </span>
          </div>
        );
      },
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => {
        const priority = params.value;
        const priorityConfig = {
          Low: "bg-gray-100 text-gray-800",
          Medium: "bg-yellow-100 text-yellow-800",
          High: "bg-red-100 text-red-800",
        };
        return (
          <div className="h-full flex items-center">
            <span
              className="px-2 py-1 rounded-full text-xs font-medium ${
                priorityConfig[priority as keyof typeof priorityConfig]
              }"
            >
              {priority}
            </span>
          </div>
        );
      },
    },
    {
      field: "region",
      headerName: "Region",
      width: 130,
      filter: "agTextColumnFilter",
    },
    {
      field: "country",
      headerName: "Country",
      width: 100,
      filter: "agTextColumnFilter",
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setTotalPages(Math.ceil(allData.length / newSize));
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "orders-pagination.csv",
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
      <div className="mb-4 flex gap-2 flex-wrap items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCsv}
            className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={clearFilters}
            className="px-2 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Page Size:
            </label>
            <select
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="pl-2 pr-8 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, allData.length)} of{" "}
            {allData.length} records
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="w-full h-96">
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<Order>
            rowData={getCurrentPageData()}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            theme="legacy"
          />
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex justify-center items-center gap-2">
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          First
        </button>
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Next
        </button>
        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          Last
        </button>
      </div>

      {/* Description */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Simple Pagination Features:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>
            • <strong>Client-Side Pagination:</strong> Efficient pagination of
            large datasets
          </li>
          <li>
            • <strong>Page Size Control:</strong> Configurable number of records
            per page
          </li>
          <li>
            • <strong>Navigation Controls:</strong> First, Previous, Next, Last
            buttons
          </li>
          <li>
            • <strong>Page Numbers:</strong> Direct navigation to specific pages
          </li>
          <li>
            • <strong>Record Counter:</strong> Shows current range and total
            records
          </li>
          <li>
            • <strong>Sorting & Filtering:</strong> Works on current page data
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SimplePaginationGrid;
