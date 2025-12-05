"use client";

import EditMenu from "@/components/edit-menu";

interface WarrantyData {
  currentLaborRate?: number | null;
  trackingPotentialHours?: number | null;
  currentPartsGP?: number | null;
  trackingPotentialPartsGP?: number | null;
  totalEligibleROsLabor?: number | null;
  totalEligibleROsParts?: number | null;
}

interface Props {
  data?: WarrantyData;
}

export default function DashboardCardWarrantyOpportunity({ data }: Props) {
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
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase mb-1">
              Current Warranty Labor
            </div>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              ${data?.currentLaborRate?.toFixed(2) ?? "0.00"}
            </div>
          </div>

          {/* Tracking Potential Labor */}
          {(() => {
            const current = data?.currentLaborRate ?? 0;
            const potential = data?.trackingPotentialHours ?? 0;
            const diff = potential - current;
            const isGreater = diff > 0.01; // Use small threshold for floating point comparison
            const isEqual = Math.abs(diff) <= 0.01;

            let bgColor = "bg-red-50 dark:bg-red-900/20";
            let borderColor = "border-red-200 dark:border-red-800";
            let textColor = "text-red-700 dark:text-red-300";
            let valueColor = "text-red-800 dark:text-red-200";
            let dateColor = "text-red-600 dark:text-red-400";

            if (isGreater) {
              bgColor = "bg-green-50 dark:bg-green-900/20";
              borderColor = "border-green-200 dark:border-green-800";
              textColor = "text-green-700 dark:text-green-300";
              valueColor = "text-green-800 dark:text-green-200";
              dateColor = "text-green-600 dark:text-green-400";
            } else if (isEqual) {
              bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
              borderColor = "border-yellow-200 dark:border-yellow-800";
              textColor = "text-yellow-700 dark:text-yellow-300";
              valueColor = "text-yellow-800 dark:text-yellow-200";
              dateColor = "text-yellow-600 dark:text-yellow-400";
            }

            return (
              <div
                className={`${bgColor} p-3 rounded-lg border ${borderColor}`}
              >
                <div
                  className={`text-xs font-medium ${textColor} uppercase mb-1`}
                >
                  Tracking Potential
                </div>
                <div
                  className={`flex items-center text-2xl font-bold ${valueColor} gap-1`}
                >
                  {potential.toFixed(2)}{" "}
                  <span className="text-xs font-normal">(Top 100)</span>
                </div>
                <div className={`text-xs ${dateColor} mt-1`}>
                  ELIGIBLE{" "}
                  {(() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 180);
                    return date.toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    });
                  })()}
                </div>
                {data?.totalEligibleROsLabor !== null &&
                  data?.totalEligibleROsLabor !== undefined && (
                    <div className={`text-xs ${dateColor} mt-1`}>
                      {data.totalEligibleROsLabor} Eligible ROs
                    </div>
                  )}
              </div>
            );
          })()}

          {/* Current Warranty Parts */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase mb-1">
              Current Warranty Parts
            </div>
            <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {data?.currentPartsGP?.toFixed(2) ?? "0.00"}%
            </div>
          </div>

          {/* Tracking Potential Parts */}
          {(() => {
            const current = data?.currentPartsGP ?? 0;
            const potential = data?.trackingPotentialPartsGP ?? 0;
            const diff = potential - current;
            const isGreater = diff > 0.01; // Use small threshold for floating point comparison
            const isEqual = Math.abs(diff) <= 0.01;

            let bgColor = "bg-red-50 dark:bg-red-900/20";
            let borderColor = "border-red-200 dark:border-red-800";
            let textColor = "text-red-700 dark:text-red-300";
            let valueColor = "text-red-800 dark:text-red-200";
            let dateColor = "text-red-600 dark:text-red-400";

            if (isGreater) {
              bgColor = "bg-green-50 dark:bg-green-900/20";
              borderColor = "border-green-200 dark:border-green-800";
              textColor = "text-green-700 dark:text-green-300";
              valueColor = "text-green-800 dark:text-green-200";
              dateColor = "text-green-600 dark:text-green-400";
            } else if (isEqual) {
              bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
              borderColor = "border-yellow-200 dark:border-yellow-800";
              textColor = "text-yellow-700 dark:text-yellow-300";
              valueColor = "text-yellow-800 dark:text-yellow-200";
              dateColor = "text-yellow-600 dark:text-yellow-400";
            }

            return (
              <div
                className={`${bgColor} p-3 rounded-lg border ${borderColor}`}
              >
                <div
                  className={`text-xs font-medium ${textColor} uppercase mb-1`}
                >
                  Tracking Potential
                </div>
                <div
                  className={`flex items-center text-2xl font-bold ${valueColor} gap-1`}
                >
                  {potential.toFixed(2)}%{" "}
                  <span className="text-xs font-normal">(Top 100)</span>
                </div>
                <div className={`text-xs ${dateColor} mt-1`}>
                  ELIGIBLE TO FILE
                </div>
                {data?.totalEligibleROsParts !== null &&
                  data?.totalEligibleROsParts !== undefined && (
                    <div className={`text-xs ${dateColor} mt-1`}>
                      {data.totalEligibleROsParts} Eligible ROs
                    </div>
                  )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
