"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent, SelectionChangedEvent, RowNode } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// Task data interface
interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "To Do" | "In Progress" | "Review" | "Done";
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

// Sample task data
const taskData: Task[] = [
  {
    id: 1,
    title: "Implement user authentication",
    description: "Create login and registration system with JWT tokens",
    assignee: "Alice Johnson",
    priority: "High",
    status: "In Progress",
    dueDate: "2024-02-15",
    estimatedHours: 16,
    actualHours: 8,
    tags: ["Backend", "Security", "API"],
    createdBy: "Project Manager",
    createdAt: "2024-01-10"
  },
  {
    id: 2,
    title: "Design mobile responsive layout",
    description: "Update UI components to be mobile-friendly",
    assignee: "Bob Smith",
    priority: "Medium",
    status: "To Do",
    dueDate: "2024-02-20",
    estimatedHours: 12,
    actualHours: 0,
    tags: ["Frontend", "UI/UX", "CSS"],
    createdBy: "Design Lead",
    createdAt: "2024-01-12"
  },
  {
    id: 3,
    title: "Write unit tests",
    description: "Add comprehensive test coverage for core modules",
    assignee: "Carol Davis",
    priority: "High",
    status: "Review",
    dueDate: "2024-02-10",
    estimatedHours: 20,
    actualHours: 18,
    tags: ["Testing", "Quality Assurance"],
    createdBy: "Tech Lead",
    createdAt: "2024-01-08"
  },
  {
    id: 4,
    title: "Database optimization",
    description: "Optimize queries and add proper indexing",
    assignee: "David Wilson",
    priority: "Critical",
    status: "In Progress",
    dueDate: "2024-02-05",
    estimatedHours: 24,
    actualHours: 12,
    tags: ["Database", "Performance", "Backend"],
    createdBy: "Tech Lead",
    createdAt: "2024-01-05"
  },
  {
    id: 5,
    title: "API documentation",
    description: "Create comprehensive API documentation",
    assignee: "Eva Brown",
    priority: "Low",
    status: "Done",
    dueDate: "2024-01-30",
    estimatedHours: 8,
    actualHours: 8,
    tags: ["Documentation", "API"],
    createdBy: "Product Manager",
    createdAt: "2024-01-01"
  },
  {
    id: 6,
    title: "Performance monitoring setup",
    description: "Implement application performance monitoring",
    assignee: "Frank Chen",
    priority: "Medium",
    status: "To Do",
    dueDate: "2024-02-25",
    estimatedHours: 14,
    actualHours: 0,
    tags: ["Monitoring", "DevOps", "Performance"],
    createdBy: "DevOps Lead",
    createdAt: "2024-01-15"
  },
  {
    id: 7,
    title: "Security audit",
    description: "Conduct comprehensive security review",
    assignee: "Grace Lee",
    priority: "Critical",
    status: "In Progress",
    dueDate: "2024-02-12",
    estimatedHours: 32,
    actualHours: 16,
    tags: ["Security", "Audit", "Compliance"],
    createdBy: "Security Lead",
    createdAt: "2024-01-03"
  },
  {
    id: 8,
    title: "User onboarding flow",
    description: "Create guided user onboarding experience",
    assignee: "Henry Wilson",
    priority: "Medium",
    status: "Review",
    dueDate: "2024-02-18",
    estimatedHours: 16,
    actualHours: 14,
    tags: ["Frontend", "UX", "Onboarding"],
    createdBy: "UX Lead",
    createdAt: "2024-01-07"
  }
];

const RowSelectionGrid: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<Task[]>([]);
  const [selectionCount, setSelectionCount] = useState(0);

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

  // Custom checkbox renderer for row selection
  const CheckboxRenderer = (params: any) => {
    return (
      <input
        type="checkbox"
        checked={params.node.isSelected()}
        onChange={(e) => {
          params.node.setSelected(e.target.checked);
        }}
        className="w-4 h-4"
      />
    );
  };

  // Custom priority renderer
  const PriorityRenderer = (params: any) => {
    const priority = params.value;
    const priorityConfig = {
      Low: { color: "bg-gray-100 text-gray-800", icon: "🔵" },
      Medium: { color: "bg-yellow-100 text-yellow-800", icon: "🟡" },
      High: { color: "bg-orange-100 text-orange-800", icon: "🟠" },
      Critical: { color: "bg-red-100 text-red-800", icon: "🔴" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {priority}
        </span>
      </div>
    );
  };

  // Custom status renderer
  const StatusRenderer = (params: any) => {
    const status = params.value;
    const statusConfig = {
      "To Do": "bg-gray-100 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Review": "bg-yellow-100 text-yellow-800",
      "Done": "bg-green-100 text-green-800"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig]}`}>
        {status}
      </span>
    );
  };

  // Custom progress renderer
  const ProgressRenderer = (params: any) => {
    const { actualHours, estimatedHours } = params.data;
    const progress = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0;
    const isOverdue = actualHours > estimatedHours;

    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              isOverdue ? "bg-red-500" : progress >= 100 ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {actualHours}h / {estimatedHours}h
        </span>
      </div>
    );
  };

  // Column definitions
  const columnDefs: ColDef<Task>[] = [
    {
      field: "id",
      headerName: "",
      width: 50,
      cellRenderer: CheckboxRenderer,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: "left",
      sortable: false,
      filter: false
    },
    {
      field: "title",
      headerName: "Task",
      width: 200,
      pinned: "left",
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {params.value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {params.data.description}
          </div>
        </div>
      )
    },
    {
      field: "assignee",
      headerName: "Assignee",
      width: 120,
      filter: "agTextColumnFilter"
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 120,
      filter: "agSetColumnFilter",
      cellRenderer: PriorityRenderer
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      filter: "agSetColumnFilter",
      cellRenderer: StatusRenderer
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 120,
      filter: "agDateColumnFilter"
    },
    {
      field: "estimatedHours",
      headerName: "Progress",
      width: 150,
      filter: "agNumberColumnFilter",
      cellRenderer: ProgressRenderer,
      sortable: false
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 200,
      filter: "agTextColumnFilter",
      cellRenderer: (params: any) => (
        <div className="flex flex-wrap gap-1">
          {params.value.map((tag: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 120,
      filter: "agTextColumnFilter"
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
  };

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    setSelectedRows(selectedData);
    setSelectionCount(selectedData.length);
  }, []);

  const selectAll = () => {
    if (gridApi) {
      gridApi.selectAll();
    }
  };

  const deselectAll = () => {
    if (gridApi) {
      gridApi.deselectAll();
    }
  };

  const selectHighPriority = () => {
    if (gridApi) {
      gridApi.forEachNode((node: RowNode) => {
        if (node.data.priority === "High" || node.data.priority === "Critical") {
          node.setSelected(true);
        }
      });
    }
  };

  const selectInProgress = () => {
    if (gridApi) {
      gridApi.forEachNode((node: RowNode) => {
        if (node.data.status === "In Progress") {
          node.setSelected(true);
        }
      });
    }
  };

  const deleteSelected = () => {
    if (selectedRows.length === 0) {
      alert("No tasks selected for deletion");
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedRows.length} selected task(s)?`;
    if (window.confirm(confirmMessage)) {
      // In a real application, you would send a delete request to the server
      console.log("Deleting tasks:", selectedRows.map(task => task.id));
      alert(`${selectedRows.length} task(s) deleted successfully!`);
      deselectAll();
    }
  };

  const updateStatus = (newStatus: Task["status"]) => {
    if (selectedRows.length === 0) {
      alert("No tasks selected for status update");
      return;
    }

    // In a real application, you would send an update request to the server
    console.log(`Updating ${selectedRows.length} tasks to status: ${newStatus}`);
    alert(`${selectedRows.length} task(s) updated to "${newStatus}" status!`);
    deselectAll();
  };

  const exportSelected = () => {
    if (selectedRows.length === 0) {
      alert("No tasks selected for export");
      return;
    }

    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `selected-tasks-${new Date().toISOString().split('T')[0]}.csv`,
        onlySelected: true
      });
    }
  };

  const getSelectedSummary = () => {
    if (selectedRows.length === 0) return null;

    const priorities = selectedRows.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statuses = selectedRows.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { priorities, statuses };
  };

  const summary = getSelectedSummary();

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 space-y-4">
        {/* Selection Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Deselect All
          </button>
          <button
            onClick={selectHighPriority}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Select High Priority
          </button>
          <button
            onClick={selectInProgress}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Select In Progress
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => updateStatus("In Progress")}
            disabled={selectedRows.length === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedRows.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Mark as In Progress
          </button>
          <button
            onClick={() => updateStatus("Done")}
            disabled={selectedRows.length === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedRows.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            Mark as Done
          </button>
          <button
            onClick={exportSelected}
            disabled={selectedRows.length === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedRows.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            Export Selected
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedRows.length === 0}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedRows.length === 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            Delete Selected
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedRows.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Selected Tasks ({selectionCount})
          </h3>
          {summary && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">By Priority:</h4>
                <div className="space-y-1">
                  {Object.entries(summary.priorities).map(([priority, count]) => (
                    <div key={priority} className="text-blue-600 dark:text-blue-400">
                      {priority}: {count}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">By Status:</h4>
                <div className="space-y-1">
                  {Object.entries(summary.statuses).map(([status, count]) => (
                    <div key={status} className="text-blue-600 dark:text-blue-400">
                      {status}: {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          <AgGridReact<Task>
            rowData={taskData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            rowSelection="multiple"
            suppressRowClickSelection={true}
            animateRows={true}
            theme="legacy"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Row Selection Features:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Multi-Selection:</strong> Select multiple rows using checkboxes</li>
          <li>• <strong>Bulk Actions:</strong> Perform actions on selected rows</li>
          <li>• <strong>Smart Selection:</strong> Select by criteria (priority, status)</li>
          <li>• <strong>Selection Summary:</strong> View statistics of selected items</li>
          <li>• <strong>Export Selected:</strong> Export only selected rows to CSV</li>
          <li>• <strong>Header Checkbox:</strong> Select/deselect all rows at once</li>
        </ul>
      </div>
    </div>
  );
};

export default RowSelectionGrid;
