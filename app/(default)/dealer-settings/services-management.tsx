"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { UserRole } from "@/lib/types/auth";
import { Plus, Edit2, Power, PowerOff } from "lucide-react";
import ServiceFormModal from "./service-form-modal";
import MultiSelectDropdown from "@/components/multi-select-dropdown";

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

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const canWrite = hasRole([UserRole.SUPER_ADMIN, UserRole.MULTI_DEALER]);

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

      {/* Services Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subcategory
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                {canWrite && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={canWrite ? 6 : 5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No services found.{" "}
                    {canWrite && "Create your first service to get started."}
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {service.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {service.category.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {service.subcategory?.name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          service.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(service.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
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
                            {service.isActive ? (
                              <PowerOff size={16} />
                            ) : (
                              <Power size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
