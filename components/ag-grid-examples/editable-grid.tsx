"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// Product data interface
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  isActive: boolean;
  lastUpdated: string;
}

// Sample product data
const initialProducts: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 99.99,
    stock: 50,
    description: "High-quality wireless headphones with noise cancellation",
    isActive: true,
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    name: "Gaming Mouse",
    category: "Accessories",
    price: 79.99,
    stock: 25,
    description: "Precision gaming mouse with RGB lighting",
    isActive: true,
    lastUpdated: "2024-01-16",
  },
  {
    id: 3,
    name: "Mechanical Keyboard",
    category: "Accessories",
    price: 149.99,
    stock: 15,
    description: "Cherry MX switches mechanical keyboard",
    isActive: true,
    lastUpdated: "2024-01-17",
  },
  {
    id: 4,
    name: "USB-C Cable",
    category: "Cables",
    price: 19.99,
    stock: 100,
    description: "High-speed USB-C cable for data transfer",
    isActive: false,
    lastUpdated: "2024-01-18",
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: 89.99,
    stock: 30,
    description: "Portable Bluetooth speaker with 360-degree sound",
    isActive: true,
    lastUpdated: "2024-01-19",
  },
];

const EditableGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [hasChanges, setHasChanges] = useState(false);

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

  // Custom cell editor for dropdown
  const CategoryEditor = (props: any) => {
    const categories = [
      "Electronics",
      "Accessories",
      "Cables",
      "Software",
      "Books",
    ];

    return (
      <select
        value={props.value}
        onChange={(e) => props.stopEditing()}
        onBlur={(e) => {
          props.api.stopEditing();
        }}
        className="w-full h-full border-0 outline-none bg-transparent"
        autoFocus
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    );
  };

  // Custom cell editor for boolean
  const BooleanEditor = (props: any) => {
    return (
      <input
        type="checkbox"
        checked={props.value}
        onChange={(e) => {
          props.api.stopEditing();
        }}
        className="w-4 h-4"
        autoFocus
      />
    );
  };

  // Column definitions
  const columnDefs: ColDef<Product>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 80,
      editable: false,
      sortable: true,
    },
    {
      field: "name",
      headerName: "Product Name",
      width: 200,
      editable: true,
      sortable: true,
      filter: "agTextColumnFilter",
      cellEditor: "agTextCellEditor",
      cellEditorParams: {
        maxLength: 50,
      },
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: true,
      sortable: true,
      filter: "agTextColumnFilter",
      cellEditor: CategoryEditor,
      cellEditorParams: {
        values: ["Electronics", "Accessories", "Cables", "Software", "Books"],
      },
    },
    {
      field: "price",
      headerName: "Price ($)",
      width: 120,
      editable: true,
      sortable: true,
      filter: "agNumberColumnFilter",
      cellEditor: "agNumberCellEditor",
      cellEditorParams: {
        min: 0,
        max: 10000,
        precision: 2,
      },
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: "stock",
      headerName: "Stock",
      width: 100,
      editable: true,
      sortable: true,
      filter: "agNumberColumnFilter",
      cellEditor: "agNumberCellEditor",
      cellEditorParams: {
        min: 0,
        max: 1000,
      },
    },
    {
      field: "description",
      headerName: "Description",
      width: 300,
      editable: true,
      sortable: true,
      filter: "agTextColumnFilter",
      cellEditor: "agLargeTextCellEditor",
      cellEditorParams: {
        maxLength: 200,
        rows: 3,
        cols: 50,
      },
    },
    {
      field: "isActive",
      headerName: "Active",
      width: 100,
      editable: true,
      sortable: true,
      filter: "agTextColumnFilter",
      cellEditor: BooleanEditor,
      cellRenderer: (params: any) => {
        return params.value ? "✓" : "✗";
      },
    },
    {
      field: "lastUpdated",
      headerName: "Last Updated",
      width: 130,
      editable: false,
      sortable: true,
      filter: "agDateColumnFilter",
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

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const { data, colDef, newValue, oldValue } = event;

    if (newValue !== oldValue) {
      setHasChanges(true);

      // Update the lastUpdated field
      const updatedData = {
        ...data,
        lastUpdated: new Date().toISOString().split("T")[0],
      };

      // Update the products array
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === data.id ? updatedData : product
        )
      );
    }
  }, []);

  const addNewProduct = () => {
    const newId = Math.max(...products.map((p) => p.id)) + 1;
    const newProduct: Product = {
      id: newId,
      name: "",
      category: "Electronics",
      price: 0,
      stock: 0,
      description: "",
      isActive: true,
      lastUpdated: new Date().toISOString().split("T")[0],
    };

    setProducts((prev) => [...prev, newProduct]);
    setHasChanges(true);

    // Focus on the new row
    setTimeout(() => {
      if (gridApi) {
        gridApi.setFocusedCell(products.length, "name");
        gridApi.startEditingCell({
          rowIndex: products.length,
          colKey: "name",
        });
      }
    }, 100);
  };

  const saveChanges = () => {
    // In a real application, you would send the data to a server
    console.log("Saving products:", products);
    setHasChanges(false);
    alert("Changes saved successfully!");
  };

  const resetChanges = () => {
    setProducts(initialProducts);
    setHasChanges(false);
  };

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "products.csv",
      });
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={addNewProduct}
          className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add New Product
        </button>
        <button
          onClick={saveChanges}
          disabled={!hasChanges}
          className={`px-2 py-1 rounded-md transition-colors ${
            hasChanges
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Save Changes
        </button>
        <button
          onClick={resetChanges}
          disabled={!hasChanges}
          className={`px-2 py-1 rounded-md transition-colors ${
            hasChanges
              ? "bg-yellow-600 text-white hover:bg-yellow-700"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
        >
          Reset Changes
        </button>
        <button
          onClick={exportToCsv}
          className="px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Status indicator */}
      {hasChanges && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            You have unsaved changes. Click "Save Changes" to persist them.
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
          <AgGridReact<Product>
            rowData={products}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            animateRows={true}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            stopEditingWhenCellsLoseFocus={true}
            undoRedoCellEditing={true}
            theme="legacy"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Editing Instructions:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Click on any cell to start editing</li>
          <li>• Press Enter to save changes, Escape to cancel</li>
          <li>• Use Tab to move to the next cell</li>
          <li>• Validation errors will be shown in red</li>
          <li>• Use Ctrl+Z to undo changes</li>
        </ul>
      </div>
    </div>
  );
};

export default EditableGrid;
