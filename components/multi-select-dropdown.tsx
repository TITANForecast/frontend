"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  disabled = false,
  className = "",
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div
        className={`
          relative w-full px-3 py-2 
          bg-white dark:bg-gray-900/30 
          border rounded-lg shadow-sm cursor-pointer
          text-sm text-gray-800 dark:text-gray-100 leading-5
          ${
            disabled
              ? "opacity-50 cursor-not-allowed dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
              : isOpen
              ? "border-gray-300 dark:border-gray-600"
              : "border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
          }
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-wrap gap-1.5 min-h-[21px]">
            {value.length === 0 ? (
              <span className="text-gray-400 dark:text-gray-500 leading-5">
                {placeholder}
              </span>
            ) : (
              selectedLabels.map((label, index) => (
                <span
                  key={value[index]}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-sm leading-5"
                >
                  {label}
                  <button
                    onClick={(e) => removeOption(value[index], e)}
                    className="hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex items-center gap-1 ml-2">
            {value.length > 0 && !disabled && (
              <button
                onClick={clearAll}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1"
                type="button"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No options available
            </div>
          ) : (
            <ul className="py-1">
              {options.map((option) => (
                <li
                  key={option.value}
                  className={`
                    px-3 py-2 cursor-pointer text-sm
                    hover:bg-gray-100 dark:hover:bg-gray-800/50
                    ${
                      value.includes(option.value)
                        ? "bg-violet-50 dark:bg-violet-900/20"
                        : ""
                    }
                  `}
                  onClick={() => toggleOption(option.value)}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value.includes(option.value)}
                      onChange={() => {}}
                      className="form-checkbox rounded text-violet-500 border-gray-300 dark:border-gray-700/60 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-gray-800 dark:text-gray-100">
                      {option.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
