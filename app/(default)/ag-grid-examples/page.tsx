"use client";

import React, { useState } from "react";
import SimpleGrid from "@/components/ag-grid-examples/simple-grid";
import BasicDataGrid from "@/components/ag-grid-examples/basic-data-grid";
// import AdvancedGroupingGrid from "@/components/ag-grid-examples/advanced-grouping-grid";
import EditableGrid from "@/components/ag-grid-examples/editable-grid";
import CustomRenderersGrid from "@/components/ag-grid-examples/custom-renderers-grid";
import SimplePaginationGrid from "@/components/ag-grid-examples/simple-pagination-grid";
import RowSelectionGrid from "@/components/ag-grid-examples/row-selection-grid";
// import ColumnMenuGrid from "@/components/ag-grid-examples/column-menu-grid";

const AgGridExamplesPage = () => {
  const [activeExample, setActiveExample] = useState("simple");

  const examples = [
    {
      id: "simple",
      title: "Simple Grid",
      description:
        "Basic AG Grid example with minimal configuration and responsive design",
      component: SimpleGrid,
    },
    {
      id: "basic",
      title: "Basic Data Grid",
      description:
        "Simple grid with sorting, filtering, and export functionality",
      component: BasicDataGrid,
    },
    // {
    //   id: "grouping",
    //   title: "Advanced Grouping",
    //   description: "Grid with row grouping, aggregation, and side panels",
    //   component: AdvancedGroupingGrid,
    // },
    {
      id: "editable",
      title: "Editable Grid",
      description:
        "Cell editing with validation, custom editors, and change tracking",
      component: EditableGrid,
    },
    {
      id: "renderers",
      title: "Custom Renderers",
      description: "Custom cell renderers, formatters, and visual components",
      component: CustomRenderersGrid,
    },
    {
      id: "pagination",
      title: "Simple Pagination",
      description:
        "Client-side pagination with navigation controls and page size options",
      component: SimplePaginationGrid,
    },
    {
      id: "selection",
      title: "Row Selection",
      description:
        "Multi-row selection with bulk actions and selection summary",
      component: RowSelectionGrid,
    },
    // {
    //   id: "column-menu",
    //   title: "Column Menu & Tooltips",
    //   description:
    //     "Advanced column management, tooltips, and financial data formatting",
    //   component: ColumnMenuGrid,
    // },
  ];

  const ActiveComponent = examples.find(
    (ex) => ex.id === activeExample
  )?.component;

  return (
    <div className="w-full">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeExample === example.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {example.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Example Description */}
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {examples.find((ex) => ex.id === activeExample)?.title}
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            {examples.find((ex) => ex.id === activeExample)?.description}
          </p>
        </div>
      </div>

      {/* Active Example */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AgGridExamplesPage;
