"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { X, Plus } from "lucide-react";

interface Service {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string | null;
  isActive: boolean;
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

interface ServiceFormModalProps {
  dealerId: string;
  service: Service | null;
  categories: Category[];
  subcategories: Subcategory[];
  onClose: (success: boolean) => void;
}

export default function ServiceFormModal({
  dealerId,
  service,
  categories: initialCategories,
  subcategories: initialSubcategories,
  onClose,
}: ServiceFormModalProps) {
  const { getAuthToken } = useAuth();
  const [name, setName] = useState(service?.name || "");
  const [categoryId, setCategoryId] = useState(service?.categoryId || "");
  const [subcategoryId, setSubcategoryId] = useState(
    service?.subcategoryId || ""
  );
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for categories and subcategories (to allow quick-add)
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [subcategories, setSubcategories] =
    useState<Subcategory[]>(initialSubcategories);

  // Quick-add state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  // Filter subcategories by selected category
  const filteredSubcategories = categoryId
    ? subcategories.filter((sub) => sub.categoryId === categoryId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const body = {
        dealerId,
        name: name.trim(),
        categoryId,
        subcategoryId: subcategoryId || null,
        isActive,
      };

      const url = service
        ? `/api/dealer-settings/services/${service.id}?dealerId=${dealerId}`
        : `/api/dealer-settings/services`;

      const response = await fetch(url, {
        method: service ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save service");
      }

      onClose(true);
    } catch (err: any) {
      setError(err.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/dealer-settings/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({
          dealerId,
          name: newCategoryName.trim(),
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create category");
      }

      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      setCategoryId(newCategory.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !categoryId) return;

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/dealer-settings/subcategories", {
        method: "POST",
        headers,
        body: JSON.stringify({
          dealerId,
          categoryId,
          name: newSubcategoryName.trim(),
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create subcategory");
      }

      const newSubcategory = await response.json();
      setSubcategories([...subcategories, newSubcategory]);
      setSubcategoryId(newSubcategory.id);
      setNewSubcategoryName("");
      setShowNewSubcategory(false);
    } catch (err: any) {
      alert(err.message || "Failed to create subcategory");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {service ? "Edit Service" : "Add Service"}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full"
              placeholder="Enter service name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1"
              >
                <Plus size={14} />
                New Category
              </button>
            </div>

            {showNewCategory ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="form-input flex-1"
                  placeholder="Category name"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName("");
                  }}
                  className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId(""); // Reset subcategory when category changes
              }}
              className="form-select w-full"
              required
            >
              <option value="">Select category</option>
              {categories
                .filter((cat) => cat.isActive)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subcategory (Optional)
              </label>
              {categoryId && (
                <button
                  type="button"
                  onClick={() => setShowNewSubcategory(!showNewSubcategory)}
                  className="text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1"
                >
                  <Plus size={14} />
                  New Subcategory
                </button>
              )}
            </div>

            {showNewSubcategory ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="form-input flex-1"
                  placeholder="Subcategory name"
                />
                <button
                  type="button"
                  onClick={handleAddSubcategory}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSubcategory(false);
                    setNewSubcategoryName("");
                  }}
                  className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="form-select w-full"
              disabled={!categoryId}
            >
              <option value="">No subcategory</option>
              {filteredSubcategories
                .filter((sub) => sub.isActive)
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="form-checkbox"
            />
            <label
              htmlFor="isActive"
              className="ml-2 text-sm text-gray-700 dark:text-gray-300"
            >
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-violet-500 hover:bg-violet-600 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : service ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
