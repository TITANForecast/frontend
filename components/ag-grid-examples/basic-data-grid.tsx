"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// Sample data interface
interface Employee {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  email: string;
  status: "Active" | "Inactive";
}

// Sample data
const sampleData: Employee[] = [
  {
    id: 1,
    name: "John Doe",
    department: "Engineering",
    position: "Senior Developer",
    salary: 95000,
    startDate: "2022-01-15",
    email: "john.doe@company.com",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    department: "Marketing",
    position: "Marketing Manager",
    salary: 78000,
    startDate: "2021-03-22",
    email: "jane.smith@company.com",
    status: "Active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    department: "Sales",
    position: "Sales Director",
    salary: 120000,
    startDate: "2020-07-10",
    email: "mike.johnson@company.com",
    status: "Active",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    department: "HR",
    position: "HR Specialist",
    salary: 65000,
    startDate: "2023-02-01",
    email: "sarah.wilson@company.com",
    status: "Active",
  },
  {
    id: 5,
    name: "David Brown",
    department: "Engineering",
    position: "Junior Developer",
    salary: 55000,
    startDate: "2023-06-15",
    email: "david.brown@company.com",
    status: "Inactive",
  },
  {
    id: 6,
    name: "Lisa Davis",
    department: "Finance",
    position: "Financial Analyst",
    salary: 72000,
    startDate: "2022-09-05",
    email: "lisa.davis@company.com",
    status: "Active",
  },
  {
    id: 7,
    name: "Tom Wilson",
    department: "Engineering",
    position: "DevOps Engineer",
    salary: 88000,
    startDate: "2021-11-20",
    email: "tom.wilson@company.com",
    status: "Active",
  },
  {
    id: 8,
    name: "Emily Chen",
    department: "Design",
    position: "UX Designer",
    salary: 75000,
    startDate: "2022-04-12",
    email: "emily.chen@company.com",
    status: "Active",
  },
];

const BasicDataGrid: React.FC = () => {
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

  // Column definitions
  const columnDefs: ColDef<Employee>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 80, // Keep fixed width for ID
      sortable: true,
      filter: "agNumberColumnFilter",
    },
    {
      field: "name",
      headerName: "Name",
      minWidth: 150, // Use minWidth instead of width
      sortable: true,
      filter: "agTextColumnFilter",
      pinned: "left",
    },
    {
      field: "department",
      headerName: "Department",
      minWidth: 130,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      field: "position",
      headerName: "Position",
      minWidth: 180,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      field: "salary",
      headerName: "Salary",
      minWidth: 120,
      sortable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      minWidth: 130,
      sortable: true,
      filter: "agDateColumnFilter",
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 200,
      sortable: true,
      filter: "agTextColumnFilter",
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 100,
      sortable: true,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => {
        const status = params.value;
        const color = status === "Active" ? "text-green-600" : "text-red-600";
        return (
          <div className="h-full flex items-center">
            <span className={`${color} font-medium`}>{status}</span>
          </div>
        );
      },
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    flex: 1, // This makes columns expand to fill available space
  };

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "employees.csv",
      });
    }
  };

  const clearFilters = () => {
    if (gridApi) {
      gridApi.setFilterModel(null);
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
      <div className="mb-4 flex gap-2">
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
        <button
          onClick={autoSizeColumns}
          className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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
          <AgGridReact<Employee>
            rowData={sampleData}
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
    </div>
  );
};

export default BasicDataGrid;
