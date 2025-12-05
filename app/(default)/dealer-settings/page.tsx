"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import ServicesManagement from "./services-management";
import MakeSettings from "./make-settings";
import OpcodeManagement from "./opcode-management";
import GeneralSettings from "./general-settings";

export default function DealerSettings() {
  const [activeTab, setActiveTab] = useState<
    "services" | "makes" | "opcodes" | "general"
  >("services");
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
          Manage service categories, vehicle makes, and operation codes for{" "}
          {currentDealer.name}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("services")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "services"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="hidden sm:inline">Services Management</span>
              <span className="sm:hidden">Services</span>
            </button>
            <button
              onClick={() => setActiveTab("makes")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "makes"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="hidden sm:inline">Make Settings</span>
              <span className="sm:hidden">Makes</span>
            </button>
            <button
              onClick={() => setActiveTab("opcodes")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "opcodes"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="hidden sm:inline">Opcode Management</span>
              <span className="sm:hidden">Opcode</span>
            </button>
            <button
              onClick={() => setActiveTab("general")}
              className={`py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === "general"
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="hidden sm:inline">General Settings</span>
              <span className="sm:hidden">General</span>
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "services" && (
            <ServicesManagement dealerId={currentDealer.id} />
          )}
          {activeTab === "makes" && (
            <MakeSettings dealerId={currentDealer.id} />
          )}
          {activeTab === "opcodes" && (
            <OpcodeManagement dealerId={currentDealer.id} />
          )}
          {activeTab === "general" && (
            <GeneralSettings dealerId={currentDealer.id} />
          )}
        </div>
      </div>
    </div>
  );
}
