"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./auth-provider-multitenancy";
import { ChevronDownIcon } from "lucide-react";

export default function DealerDropdown() {
  const { user, currentDealer, switchDealer } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!user || !currentDealer) {
    return null;
  }

  const handleDealerSwitch = async (dealerId: string) => {
    try {
      await switchDealer(dealerId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch dealer:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
      >
        <span>{currentDealer.name}</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-50">
          <div className="py-1">
            {user.dealers.map((dealer) => (
              <button
                key={dealer.id}
                onClick={() => handleDealerSwitch(dealer.id)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  dealer.id === currentDealer.id
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                <div className="font-medium">{dealer.name}</div>
                {dealer.address && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dealer.address}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
