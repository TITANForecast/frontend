"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

// User data interface
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: "Online" | "Away" | "Offline";
  lastLogin: string;
  score: number;
  progress: number;
  tags: string[];
  isVerified: boolean;
}

// Sample user data
const userData: User[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    role: "Admin",
    status: "Online",
    lastLogin: "2024-01-15T10:30:00Z",
    score: 95,
    progress: 87,
    tags: ["Frontend", "React", "TypeScript"],
    isVerified: true
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@company.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    role: "Developer",
    status: "Away",
    lastLogin: "2024-01-15T09:15:00Z",
    score: 78,
    progress: 65,
    tags: ["Backend", "Node.js", "Python"],
    isVerified: false
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol.davis@company.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    role: "Designer",
    status: "Online",
    lastLogin: "2024-01-15T11:45:00Z",
    score: 92,
    progress: 94,
    tags: ["UI/UX", "Figma", "Adobe"],
    isVerified: true
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.wilson@company.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    role: "Manager",
    status: "Offline",
    lastLogin: "2024-01-14T16:20:00Z",
    score: 88,
    progress: 72,
    tags: ["Management", "Strategy", "Leadership"],
    isVerified: true
  },
  {
    id: 5,
    name: "Eva Brown",
    email: "eva.brown@company.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
    role: "Developer",
    status: "Online",
    lastLogin: "2024-01-15T12:00:00Z",
    score: 85,
    progress: 58,
    tags: ["Mobile", "React Native", "iOS"],
    isVerified: false
  }
];

// Custom Avatar Cell Renderer
const AvatarRenderer = (params: ICellRendererParams) => {
  return (
    <div className="flex items-center space-x-3">
      <img
        src={params.value}
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://via.placeholder.com/40x40/6B7280/FFFFFF?text=U";
        }}
      />
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {params.data.name}
      </span>
    </div>
  );
};

// Custom Status Cell Renderer
const StatusRenderer = (params: ICellRendererParams) => {
  const status = params.value;
  const statusConfig = {
    Online: { color: "bg-green-500", text: "text-green-800", bg: "bg-green-100" },
    Away: { color: "bg-yellow-500", text: "text-yellow-800", bg: "bg-yellow-100" },
    Offline: { color: "bg-gray-500", text: "text-gray-800", bg: "bg-gray-100" }
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    </div>
  );
};

// Custom Score Cell Renderer
const ScoreRenderer = (params: ICellRendererParams) => {
  const score = params.value;
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <span className={`font-semibold ${getScoreColor(score)}`}>
        {score}%
      </span>
    </div>
  );
};

// Custom Progress Cell Renderer
const ProgressRenderer = (params: ICellRendererParams) => {
  const progress = params.value;
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-blue-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getProgressColor(progress)}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {progress}%
      </span>
    </div>
  );
};

// Custom Tags Cell Renderer
const TagsRenderer = (params: ICellRendererParams) => {
  const tags = params.value;
  
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag: string, index: number) => (
        <span
          key={index}
          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

// Custom Verified Cell Renderer
const VerifiedRenderer = (params: ICellRendererParams) => {
  const isVerified = params.value;
  
  return (
    <div className="flex items-center justify-center">
      {isVerified ? (
        <div className="flex items-center space-x-1 text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">Verified</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">Unverified</span>
        </div>
      )}
    </div>
  );
};

// Custom Role Cell Renderer
const RoleRenderer = (params: ICellRendererParams) => {
  const role = params.value;
  const roleConfig = {
    Admin: { color: "bg-red-100 text-red-800", icon: "👑" },
    Manager: { color: "bg-purple-100 text-purple-800", icon: "👔" },
    Developer: { color: "bg-blue-100 text-blue-800", icon: "💻" },
    Designer: { color: "bg-pink-100 text-pink-800", icon: "🎨" }
  };

  const config = roleConfig[role as keyof typeof roleConfig] || { color: "bg-gray-100 text-gray-800", icon: "👤" };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg">{config.icon}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {role}
      </span>
    </div>
  );
};

const CustomRenderersGrid: React.FC = () => {
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

  // Column definitions with custom renderers
  const columnDefs: ColDef<User>[] = [
    {
      field: "avatar",
      headerName: "User",
      width: 200,
      cellRenderer: AvatarRenderer,
      sortable: false,
      filter: false,
      pinned: "left"
    },
    {
      field: "email",
      headerName: "Email",
      width: 250,
      sortable: true,
      filter: "agTextColumnFilter",
      cellRenderer: (params: ICellRendererParams) => (
        <a 
          href={`mailto:${params.value}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {params.value}
        </a>
      )
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      sortable: true,
      filter: "agSetColumnFilter",
      cellRenderer: RoleRenderer
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      sortable: true,
      filter: "agSetColumnFilter",
      cellRenderer: StatusRenderer
    },
    {
      field: "score",
      headerName: "Score",
      width: 150,
      sortable: true,
      filter: "agNumberColumnFilter",
      cellRenderer: ScoreRenderer
    },
    {
      field: "progress",
      headerName: "Progress",
      width: 150,
      sortable: true,
      filter: "agNumberColumnFilter",
      cellRenderer: ProgressRenderer
    },
    {
      field: "tags",
      headerName: "Skills",
      width: 200,
      sortable: false,
      filter: "agTextColumnFilter",
      cellRenderer: TagsRenderer
    },
    {
      field: "isVerified",
      headerName: "Verified",
      width: 120,
      sortable: true,
      filter: "agSetColumnFilter",
      cellRenderer: VerifiedRenderer
    },
    {
      field: "lastLogin",
      headerName: "Last Login",
      width: 150,
      sortable: true,
      filter: "agDateColumnFilter",
      valueFormatter: (params) => {
        const date = new Date(params.value);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
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

  const exportToCsv = () => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: "users-custom-renderers.csv"
      });
    }
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex gap-2">
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
          <AgGridReact<User>
            rowData={userData}
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

      {/* Description */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Custom Cell Renderers:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Avatar:</strong> Custom image with fallback and name display</li>
          <li>• <strong>Status:</strong> Colored indicators with status badges</li>
          <li>• <strong>Score:</strong> Progress bar with color coding</li>
          <li>• <strong>Progress:</strong> Animated progress bars</li>
          <li>• <strong>Tags:</strong> Styled tag chips for skills</li>
          <li>• <strong>Verified:</strong> Icon indicators with text</li>
          <li>• <strong>Role:</strong> Role badges with emoji icons</li>
          <li>• <strong>Email:</strong> Clickable mailto links</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomRenderersGrid;
