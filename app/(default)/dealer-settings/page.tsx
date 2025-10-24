"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import ServicesManagement from "./services-management";
import OperationsManagement from "./operations-management";

export default function DealerSettings() {
  const [activeTab, setActiveTab] = useState<"operations" | "services">(
    "operations"
  );
  const { currentDealer } = useAuth();

  if (!currentDealer) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please select a dealer to view settings.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
          Dealer Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Manage service categories and operation mappings for{" "}
          {currentDealer.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("operations")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "operations"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Operations Management
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "services"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Services Management
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "operations" && (
            <OperationsManagement dealerId={currentDealer.id} />
          )}
          {activeTab === "services" && (
            <ServicesManagement dealerId={currentDealer.id} />
          )}
        </div>
      </div>
    </div>
  );
}
