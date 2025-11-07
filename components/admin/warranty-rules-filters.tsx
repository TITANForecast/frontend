"use client";

import { useState, useEffect, useRef } from "react";
import MultiSelectDropdown from "@/components/multi-select-dropdown";
import { Search, X } from "lucide-react";

interface WarrantyRulesFiltersProps {
  makes: string[];
  categories: string[];
  states: string[];
  selectedMakes: string[];
  selectedCategories: string[];
  selectedStates: string[];
  selectedStatuses: string[];
  searchQuery: string;
  onMakesChange: (makes: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  onStatesChange: (states: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onSearchChange: (query: string) => void;
  onSearchSuggestions: (query: string) => Promise<string[]>;
}

export default function WarrantyRulesFilters({
  makes,
  categories,
  states,
  selectedMakes,
  selectedCategories,
  selectedStates,
  selectedStatuses,
  searchQuery,
  onMakesChange,
  onCategoriesChange,
  onStatesChange,
  onStatusesChange,
  onSearchChange,
  onSearchSuggestions,
}: WarrantyRulesFiltersProps) {
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when search query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const suggestions = await onSearchSuggestions(searchQuery.trim());
          setSearchSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSearchSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearchSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchChange("");
    setShowSuggestions(false);
  };

  const statusOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const makeOptions = makes.map((make) => ({
    value: make,
    label: make,
  }));

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category,
  }));

  const stateOptions = states.map((state) => ({
    value: state,
    label: state,
  }));

  const hasActiveFilters =
    selectedMakes.length > 0 ||
    selectedCategories.length > 0 ||
    selectedStates.length > 0 ||
    selectedStatuses.length > 0 ||
    searchQuery.trim().length > 0;

  const clearAllFilters = () => {
    onMakesChange([]);
    onCategoriesChange([]);
    onStatesChange([]);
    onStatusesChange([]);
    onSearchChange("");
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Make Filter */}
        <div>
          <MultiSelectDropdown
            label="Make"
            options={makeOptions}
            value={selectedMakes}
            onChange={onMakesChange}
            placeholder="Select makes..."
            className="w-full"
          />
        </div>

        {/* State Filter */}
        <div>
          <MultiSelectDropdown
            label="State"
            options={stateOptions}
            value={selectedStates}
            onChange={onStatesChange}
            placeholder="Select states..."
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div>
          <MultiSelectDropdown
            label="Category"
            options={categoryOptions}
            value={selectedCategories}
            onChange={onCategoriesChange}
            placeholder="Select categories..."
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <MultiSelectDropdown
            label="Status"
            options={statusOptions}
            value={selectedStatuses}
            onChange={onStatusesChange}
            placeholder="Select status..."
            className="w-full"
          />
        </div>

        {/* Search with Autocomplete */}
        <div
          className="relative col-span-1 md:col-span-2 xl:col-span-2"
          ref={searchRef}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Keyword Pattern
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Search keyword patterns..."
              className="form-input w-full pl-9 pr-8"
            />
            <div className="absolute inset-0 right-auto flex items-center pointer-events-none">
              <Search
                size={16}
                className="ml-3 text-gray-400 dark:text-gray-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-0 left-auto flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isLoadingSuggestions ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading suggestions...
                </div>
              ) : searchSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No suggestions found
                </div>
              ) : (
                <ul className="py-1">
                  {searchSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-100"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
            type="button"
          >
            <X size={14} />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
