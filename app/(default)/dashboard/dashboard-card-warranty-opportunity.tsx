"use client";

import EditMenu from "@/components/edit-menu";

export default function DashboardCardWarrantyOpportunity() {
  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Warranty Opportunity
          </h2>
          <EditMenu align="right" />
        </header>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Warranty Labor */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase mb-1">
              Current Warranty Labor
            </div>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              $166.59
            </div>
          </div>

          {/* Tracking Potential Labor */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-xs font-medium text-green-700 dark:text-green-300 uppercase mb-1">
              Tracking Potential
            </div>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              175.42
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              ELIGIBLE 11/13/2025
            </div>
          </div>

          {/* Current Warranty Parts */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase mb-1">
              Current Warranty Parts
            </div>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              $67%
            </div>
          </div>

          {/* Tracking Potential Parts */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase mb-1">
              Tracking Potential
            </div>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">
              69%
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              ELIGIBLE TO FILE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
