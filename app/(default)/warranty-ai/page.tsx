"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import OperationsManagement from "@/app/(default)/dealer-settings/operations-management";
import ROSSelection from "./ro-selection";

export default function WarrantyAIPage() {
  const { currentDealer } = useAuth();
  const [activeTab, setActiveTab] = useState<"operations" | "ro-selection">(
    "operations"
  );

  if (!currentDealer) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please select a dealer to use Warranty AI.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Warranty AI
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Manage warranty operations and optimize RO selection for warranty rate
          increase requests
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("operations")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "operations"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Operations Management
            </button>
            <button
              onClick={() => setActiveTab("ro-selection")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "ro-selection"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              RO Selection
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "operations" && (
            <OperationsManagement dealerId={currentDealer.id} />
          )}
          {activeTab === "ro-selection" && <ROSSelection />}
        </div>
      </div>
    </div>
  );
}

