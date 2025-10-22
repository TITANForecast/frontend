"use client";

import { useEffect, useState } from "react";
import FilterButton from "@/components/dropdown-filter";
import Datepicker from "@/components/datepicker";
import DashboardCard01 from "./dashboard-card-01";
import DashboardCard02 from "./dashboard-card-02";
import DashboardCard03 from "./dashboard-card-03";
import DashboardCard04 from "./dashboard-card-04";
import DashboardCard05 from "./dashboard-card-05";
import DashboardCard06 from "./dashboard-card-06";
import DashboardCard07 from "./dashboard-card-07";
import DashboardCard08 from "./dashboard-card-08";
import DashboardCard09 from "./dashboard-card-09";
import DashboardCard10 from "./dashboard-card-10";
import DashboardCard11 from "./dashboard-card-11";
import DashboardCardGrossProfit from "./dashboard-card-gross-profit";
import DashboardCardRoCount from "./dashboard-card-ro-count";
import DashboardCardWarrantyOpportunity from "./dashboard-card-warranty-opportunity";
import DashboardCardTechnicianProduction from "./dashboard-card-technician-production";
import DashboardCardOpcodes from "./dashboard-card-opcodes";
import DashboardCardAdvisorElr from "./dashboard-card-advisor-elr";
import DashboardCardAGKPIGauge from "./dashboard-card-ag-kpi-gauge";
import EChartsDemo from "@/components/echarts-demo";
import EChartsComprehensiveDemo from "@/components/echarts-comprehensive-demo";
import AgGridExamplesPage from "../ag-grid-examples/page";
import {
  processDashboardData,
  ProcessedDashboardData,
  DMSData,
  KPIResults,
} from "@/lib/utils/dashboard-data-processor";
import { useAuth } from "@/components/auth-provider-multitenancy";

export default function Dashboard() {
  const { currentDealer } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<ProcessedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentDealer) {
        console.log("No dealer selected, skipping data fetch");
        return;
      }

      try {
        setLoading(true);
        console.log(
          `Fetching dashboard data for dealer: ${currentDealer.name} (${currentDealer.id})`
        );

        const response = await fetch(
          `/api/dms/delivery?dealerId=${currentDealer.id}`
        );
        const result = await response.json();

        if (result.data) {
          // Process data with pre-calculated KPIs if available
          const processed = processDashboardData(
            result.data as DMSData,
            result.kpis as KPIResults | null
          );
          setDashboardData(processed);
          console.log(
            `Dashboard data processed: ${result.data.totalRecords} records from ${result.source}`
          );
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentDealer]); // Re-fetch when dealer changes

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading dashboard data...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Dashboard actions */}
      {/* <div className="sm:flex sm:justify-between sm:items-center mb-8"> */}
      {/* Left: Title */}
      {/* <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
            Dashboard
          </h1>
        </div> */}
      {/* Right: Actions */}
      {/* <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <FilterButton align="right" />
          <Datepicker />
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
            <svg
              className="fill-current shrink-0 xs:hidden"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add View</span>
          </button>
        </div> */}
      {/* </div> */}
      {/* </div> */}

      {/* Main Dashboard Charts */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Gross Profit Performance */}
          <DashboardCardGrossProfit data={dashboardData?.grossProfit} />
          {/* RO Count */}
          <DashboardCardRoCount data={dashboardData?.roCount} />
          {/* Warranty Opportunity */}
          <DashboardCardWarrantyOpportunity data={dashboardData?.warranty} />
        </div>
      </div>

      {/* KPI Gauges Section */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Labor GP % */}
          <DashboardCardAGKPIGauge
            value={dashboardData?.kpis.laborGPPercent || 85.5}
            name="Labor GP %"
            min={66}
            max={96}
            redZone={[66, 78]}
            yellowZone={[78, 84]}
            greenZone={[84, 96]}
            className="col-span-12 md:col-span-6 lg:col-span-3"
          />
          {/* Labor $/RO */}
          <DashboardCardAGKPIGauge
            value={dashboardData?.kpis.laborPerRO || 222}
            name="Labor $/RO"
            min={120}
            max={280}
            redZone={[120, 160]}
            yellowZone={[160, 200]}
            greenZone={[200, 280]}
            className="col-span-12 md:col-span-6 lg:col-span-3"
          />
          {/* Hrs/RO */}
          <DashboardCardAGKPIGauge
            value={dashboardData?.kpis.hoursPerRO || 1.29}
            name="Hrs/RO"
            min={1.1}
            max={1.6}
            redZone={[1.1, 1.2]}
            yellowZone={[1.2, 1.4]}
            greenZone={[1.4, 1.6]}
            className="col-span-12 md:col-span-6 lg:col-span-3"
          />
          {/* ELR Total */}
          <DashboardCardAGKPIGauge
            value={dashboardData?.kpis.elrTotal || 177.5}
            name="ELR Total"
            min={140}
            max={280}
            redZone={[140, 180]}
            yellowZone={[180, 220]}
            greenZone={[220, 280]}
            className="col-span-12 md:col-span-6 lg:col-span-3"
          />
        </div>
      </div>

      {/* Report Buttons */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-4">
          <button className="btn bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-6 py-3 rounded-lg font-medium">
            Business Analysis Report
          </button>
          <button className="btn bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 px-6 py-3 rounded-lg font-medium">
            Direct Impact Report
          </button>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 px-6 py-3 rounded-lg font-medium">
            Warranty Opportunity
          </button>
        </div>
      </div>

      {/* Secondary Dashboard Charts */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-6">
          <DashboardCardTechnicianProduction
            data={dashboardData?.technicians}
          />
          <DashboardCardOpcodes data={dashboardData?.opcodes} />
          <DashboardCardAdvisorElr data={dashboardData?.advisors} />
        </div>
      </div>

      {/* Cards */}
      {/* <div className="grid grid-cols-12 gap-6"> */}
      {/* Line chart (Acme Plus) */}
      {/* <DashboardCard01 /> */}
      {/* Line chart (Acme Advanced) */}
      {/* <DashboardCard02 /> */}
      {/* Line chart (Acme Professional) */}
      {/* <DashboardCard03 /> */}
      {/* Bar chart (Direct vs Indirect) */}
      {/* <DashboardCard04 /> */}
      {/* Line chart (Real Time Value) */}
      {/* <DashboardCard05 /> */}
      {/* Doughnut chart (Top Countries) */}
      {/* <DashboardCard06 /> */}
      {/* Table (Top Channels) */}
      {/* <DashboardCard07 /> */}
      {/* Line chart (Sales Over Time) */}
      {/* <DashboardCard08 /> */}
      {/* Stacked bar chart (Sales VS Refunds) */}
      {/* <DashboardCard09 /> */}
      {/* Card (Recent Activity) */}
      {/* <DashboardCard10 /> */}
      {/* Card (Income/Expenses) */}
      {/* <DashboardCard11 /> */}
      {/* </div> */}

      {/* ECharts Demo Section */}
      {/* <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            ECharts Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive charts powered by Apache ECharts with dark theme support
          </p>
        </div>
        <EChartsDemo />
      </div> */}

      {/* ECharts Comprehensive Examples */}
      {/* <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Advanced ECharts Examples
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive chart library with 8 different chart types including
            area, scatter, radar, gauge, funnel, heatmap, treemap, and sankey
            diagrams
          </p>
        </div>
        <EChartsComprehensiveDemo />
      </div> */}

      {/* AG-Grid Section */}
      {/* <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Data Grid
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced data grid with sorting, filtering, and rounded corners
          </p>
        </div>
        <AgGridExamplesPage />
      </div> */}
    </div>
  );
}
