"use client";

import React, { useState } from "react";
import BasicDataGrid from "@/components/ag-grid-examples/basic-data-grid";
import AdvancedGroupingGrid from "@/components/ag-grid-examples/advanced-grouping-grid";
import EditableGrid from "@/components/ag-grid-examples/editable-grid";
import CustomRenderersGrid from "@/components/ag-grid-examples/custom-renderers-grid";
import ServerSideGrid from "@/components/ag-grid-examples/server-side-grid";
import RowSelectionGrid from "@/components/ag-grid-examples/row-selection-grid";
import ColumnMenuGrid from "@/components/ag-grid-examples/column-menu-grid";

const AgGridExamplesPage = () => {
  const [activeExample, setActiveExample] = useState("basic");

  const examples = [
    {
      id: "basic",
      title: "Basic Data Grid",
      description: "Simple grid with sorting, filtering, and export functionality",
      component: BasicDataGrid
    },
    {
      id: "grouping",
      title: "Advanced Grouping",
      description: "Grid with row grouping, aggregation, and side panels",
      component: AdvancedGroupingGrid
    },
    {
      id: "editable",
      title: "Editable Grid",
      description: "Cell editing with validation, custom editors, and change tracking",
      component: EditableGrid
    },
    {
      id: "renderers",
      title: "Custom Renderers",
      description: "Custom cell renderers, formatters, and visual components",
      component: CustomRenderersGrid
    },
    {
      id: "server-side",
      title: "Server-Side Data",
      description: "Server-side row model with pagination and large datasets",
      component: ServerSideGrid
    },
    {
      id: "selection",
      title: "Row Selection",
      description: "Multi-row selection with bulk actions and selection summary",
      component: RowSelectionGrid
    },
    {
      id: "column-menu",
      title: "Column Menu & Tooltips",
      description: "Advanced column management, tooltips, and financial data formatting",
      component: ColumnMenuGrid
    }
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AG Grid React Examples
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive examples showcasing AG Grid React capabilities including sorting, filtering, 
            editing, custom renderers, server-side data, row selection, and more.
          </p>
        </div>

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
              {examples.find(ex => ex.id === activeExample)?.title}
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              {examples.find(ex => ex.id === activeExample)?.description}
            </p>
          </div>
        </div>

        {/* Active Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>

        {/* Features Overview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            AG Grid Features Demonstrated
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sorting & Filtering</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Built-in sorting and filtering capabilities with multiple filter types including text, number, date, and set filters.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cell Editing</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Inline cell editing with validation, custom editors, and undo/redo functionality for data manipulation.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Renderers</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Custom cell renderers and formatters for displaying complex data types with rich visual components.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Row Selection</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Multi-row selection with bulk actions, selection summary, and smart selection criteria.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Server-Side Data</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Server-side row model for handling large datasets with pagination, sorting, and filtering.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Column Management</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Advanced column management with tooltips, column menus, resizing, and side panels.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Getting Started with AG Grid
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Installation
              </h3>
              <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <code className="text-green-400 text-sm">
                  npm install ag-grid-community ag-grid-react
                </code>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                For enterprise features, also install:
              </p>
              <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4">
                <code className="text-green-400 text-sm">
                  npm install ag-grid-enterprise
                </code>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Basic Usage
              </h3>
              <div className="bg-gray-900 dark:bg-gray-700 rounded-lg p-4">
                <pre className="text-green-400 text-sm overflow-x-auto">
{`import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

const MyGrid = () => (
  <div className="ag-theme-quartz" style={{height: 400}}>
    <AgGridReact rowData={rowData} columnDefs={columnDefs} />
  </div>
);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgGridExamplesPage;
