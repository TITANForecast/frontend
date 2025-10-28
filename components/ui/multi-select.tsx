"use client";

import { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const getSelectedLabels = () => {
    if (selectedValues.length === 0) return placeholder;
    return options
      .filter(opt => selectedValues.includes(opt.value))
      .map(opt => opt.label)
      .join(', ');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input w-full text-left flex items-center justify-between"
      >
        <span className={selectedValues.length === 0 ? 'text-gray-400' : ''}>
          {getSelectedLabels()}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-start px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => toggleOption(option.value)}
                className="form-checkbox mt-0.5 mr-3"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </div>
                {option.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

