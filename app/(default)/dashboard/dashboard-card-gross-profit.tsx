"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

interface GrossProfitData {
  months: string[];
  customerPay: number[];
  warranty: number[];
  internal: number[];
}

interface Props {
  data?: GrossProfitData;
}

export default function DashboardCardGrossProfit({ data }: Props) {
  const [isDark, setIsDark] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Use real data if available, otherwise use mock data
  const chartData = data || {
    months: ["January", "February", "March", "April", "May", "June", 
             "July", "August", "September", "October", "November", "December"],
    customerPay: [45, 48, 42, 50, 52, 48, 45, 47, 49, 51, 53, 50],
    warranty: [38, 40, 35, 42, 44, 40, 38, 39, 41, 43, 45, 42],
    internal: [35, 38, 25, 30, 32, 28, 26, 28, 30, 32, 34, 31],
  };

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: isDark ? "#374151" : "#ffffff",
      borderColor: isDark ? "#4B5563" : "#E5E7EB",
      textStyle: {
        color: isDark ? "#F9FAFB" : "#111827",
      },
    },
    legend: {
      data: ["Customer Pay", "Warranty", "Internal"],
      bottom: 0,
      textStyle: {
        color: isDark ? "#D1D5DB" : "#6B7280",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: chartData.months,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
        rotate: 45,
        fontSize: 11,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: "{value}%",
        color: isDark ? "#9CA3AF" : "#6B7280",
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "#374151" : "#F3F4F6",
        },
      },
    },
    series: [
      {
        name: "Customer Pay",
        type: "line",
        data: chartData.customerPay,
        smooth: true,
        lineStyle: {
          color: "#3B82F6",
          width: 2,
        },
        itemStyle: {
          color: "#3B82F6",
        },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: "Warranty",
        type: "line",
        data: chartData.warranty,
        smooth: true,
        lineStyle: {
          color: "#8B5CF6",
          width: 2,
          type: "dashed",
        },
        itemStyle: {
          color: "#8B5CF6",
        },
        symbol: "circle",
        symbolSize: 4,
      },
      {
        name: "Internal",
        type: "line",
        data: chartData.internal,
        smooth: true,
        lineStyle: {
          color: "#EF4444",
          width: 2,
          type: "dashed",
        },
        itemStyle: {
          color: "#EF4444",
        },
        symbol: "circle",
        symbolSize: 4,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Gross Profit Performance
          </h2>
          <EditMenu align="right" />
        </header>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            Performance
          </div>
          <div className="flex items-center text-sm font-medium text-green-700 px-2 py-1 bg-green-500/20 rounded-full">
            <span className="mr-1">↑</span>
            68%
          </div>
        </div>
      </div>
      {/* ECharts */}
      <div className="grow h-[300px] pb-5">
        <ReactECharts
          option={chartOption}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      </div>
    </div>
  );
}
