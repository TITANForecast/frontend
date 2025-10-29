"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import { Plus, Edit2, Power, PowerOff } from "lucide-react";
import ServiceFormModal from "./service-form-modal";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// Import AG Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Service {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
}

interface ServicesManagementProps {
  dealerId: string;
}

export default function ServicesManagement({
  dealerId,
}: ServicesManagementProps) {
  const { user, hasRole, getAuthToken } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

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

  useEffect(() => {
    fetchData();
  }, [dealerId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [servicesRes, categoriesRes, subcategoriesRes] = await Promise.all([
        fetch(`/api/dealer-settings/services?dealerId=${dealerId}`, {
          headers,
        }),
        fetch(`/api/dealer-settings/categories?dealerId=${dealerId}`, {
          headers,
        }),
        fetch(`/api/dealer-settings/subcategories?dealerId=${dealerId}`, {
          headers,
        }),
      ]);

      if (!servicesRes.ok || !categoriesRes.ok || !subcategoriesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [servicesData, categoriesData, subcategoriesData] =
        await Promise.all([
          servicesRes.json(),
          categoriesRes.json(),
          subcategoriesRes.json(),
        ]);

      setServices(servicesData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (service: Service) => {
    if (!canWrite) return;

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/services/${service.id}?dealerId=${dealerId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            dealerId,
            isActive: !service.isActive,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update service");
      }

      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to update service");
    }
  };

  const handleModalClose = (success: boolean) => {
    setIsModalOpen(false);
    setEditingService(null);
    if (success) {
      fetchData();
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    if (
      categoryFilter.length > 0 &&
      !categoryFilter.includes(service.categoryId)
    ) {
      return false;
    }
    if (subcategoryFilter.length > 0) {
      if (
        !service.subcategoryId ||
        !subcategoryFilter.includes(service.subcategoryId)
      ) {
        return false;
      }
    }
    if (activeFilter === "active" && !service.isActive) {
      return false;
    }
    if (activeFilter === "inactive" && service.isActive) {
      return false;
    }
    return true;
  });

  // Get filtered subcategories based on selected categories
  const filteredSubcategoriesForFilter =
    categoryFilter.length > 0
      ? subcategories.filter((sub) => categoryFilter.includes(sub.categoryId))
      : subcategories;

  // Cell Renderers
  const StatusCellRenderer = useCallback(
    (props: ICellRendererParams<Service>) => {
      const service = props.data;
      if (!service) return null;

      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            service.isActive
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
          }`}
        >
          {service.isActive ? "Active" : "Inactive"}
        </span>
      );
    },
    []
  );

  const DateCellRenderer = useCallback(
    (props: ICellRendererParams<Service>) => {
      return (
        <span className="text-sm">
          {props.data?.createdAt
            ? new Date(props.data.createdAt).toLocaleDateString()
            : "-"}
        </span>
      );
    },
    []
  );

  const ActionsCellRenderer = useCallback(
    (props: ICellRendererParams<Service>) => {
      if (!canWrite) return null;
      const service = props.data;
      if (!service) return null;

      return (
        <div className="flex items-center justify-end gap-2 h-full">
          <button
            onClick={() => handleEditService(service)}
            className="text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
            title="Edit service"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleToggleActive(service)}
            className={`${
              service.isActive
                ? "text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                : "text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
            }`}
            title={service.isActive ? "Deactivate" : "Activate"}
          >
            {service.isActive ? <PowerOff size={16} /> : <Power size={16} />}
          </button>
        </div>
      );
    },
    [canWrite]
  );

  // AG Grid column definitions
  const columnDefs: ColDef<Service>[] = useMemo(() => {
    const cols: ColDef<Service>[] = [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 200,
        filter: "agTextColumnFilter",
        sortable: true,
      },
      {
        field: "category.name",
        headerName: "Category",
        width: 180,
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params) => params.data?.category?.name || "",
      },
      {
        field: "subcategory.name",
        headerName: "Subcategory",
        width: 180,
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params) => params.data?.subcategory?.name || "-",
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
        sortable: true,
        filter: "agTextColumnFilter",
        filterParams: {
          valueGetter: (params: any) =>
            params.data?.isActive ? "Active" : "Inactive",
        },
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "createdAt",
        headerName: "Created",
        width: 140,
        sortable: true,
        filter: "agDateColumnFilter",
        cellRenderer: DateCellRenderer,
      },
    ];

    if (canWrite) {
      cols.push({
        headerName: "Actions",
        width: 120,
        cellRenderer: ActionsCellRenderer,
        sortable: false,
        filter: false,
        cellStyle: { textAlign: "right" },
      });
    }

    return cols;
  }, [canWrite]);

  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  );

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Loading services...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions and Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="min-w-[250px]">
            <MultiSelectDropdown
              label="Category"
              options={categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              }))}
              value={categoryFilter}
              onChange={(selected) => {
                setCategoryFilter(selected);
                setSubcategoryFilter([]); // Reset subcategory filter
              }}
              placeholder="Select categories..."
            />
          </div>

          {/* Subcategory Filter */}
          <div className="min-w-[250px]">
            <MultiSelectDropdown
              label="Subcategory"
              options={filteredSubcategoriesForFilter.map((sub) => ({
                value: sub.id,
                label: sub.name,
              }))}
              value={subcategoryFilter}
              onChange={setSubcategoryFilter}
              placeholder="Select subcategories..."
              disabled={categoryFilter.length === 0}
            />
          </div>

          {/* Active Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="form-select w-full"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {canWrite && (
          <button
            onClick={handleAddService}
            className="btn bg-violet-500 hover:bg-violet-600 text-white"
          >
            <Plus size={16} className="mr-2" />
            Add Service
          </button>
        )}
      </div>

      {/* Services Grid */}
      <div className="w-full" style={{ height: "600px" }}>
        <div
          className={`${
            isDark ? "ag-theme-quartz-dark" : "ag-theme-quartz"
          } rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}
          style={{ height: "100%", width: "100%" }}
        >
          <AgGridReact<Service>
            rowData={filteredServices}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[25, 50, 100]}
            animateRows={true}
            domLayout="normal"
            suppressCellFocus={true}
            theme="legacy"
          />
        </div>
      </div>

      {/* Service Form Modal */}
      {isModalOpen && (
        <ServiceFormModal
          dealerId={dealerId}
          service={editingService}
          categories={categories}
          subcategories={subcategories}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
