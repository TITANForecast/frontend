"use client";
import React, { useState, useEffect } from "react";

import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// Row Data Interface
interface IRow {
  make: string;
  model: string;
  price: number;
  electric: boolean;
}

// Simple Grid Component
const SimpleGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Row Data: The data to be displayed.
  const [rowData, setRowData] = useState<IRow[]>([
    { make: "Tesla", model: "Model Y", price: 64950, electric: true },
    { make: "Ford", model: "F-Series", price: 33850, electric: false },
    { make: "Toyota", model: "Corolla", price: 29600, electric: false },
    { make: "Mercedes", model: "EQA", price: 48890, electric: true },
    { make: "Fiat", model: "500", price: 15774, electric: false },
    { make: "Nissan", model: "Juke", price: 20675, electric: false },
  ]);

  // Column Definitions: Defines & controls grid columns.
  const [colDefs, setColDefs] = useState<ColDef<IRow>[]>([
    { 
      field: "make",
      headerName: "Make",
      minWidth: 120,
    },
    { 
      field: "model",
      headerName: "Model",
      minWidth: 150,
    },
    { 
      field: "price",
      headerName: "Price",
      minWidth: 120,
      valueFormatter: (params) => `$${params.value.toLocaleString()}`,
    },
    { 
      field: "electric",
      headerName: "Electric",
      minWidth: 100,
      cellRenderer: (params: any) => {
        return (
          <div className="h-full flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              params.value 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}>
              {params.value ? "Yes" : "No"}
            </span>
          </div>
        );
      },
    },
  ]);

  const defaultColDef: ColDef = {
    flex: 1,
    resizable: true,
    sortable: true,
    filter: true,
  };

  // Container: Defines the grid's theme & dimensions.
  return (
    <div className="w-full">
      {/* Grid */}
      <div className="w-full h-96">
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            theme="legacy"
          />
        </div>
      </div>
    </div>
  );
};

export default SimpleGrid;
