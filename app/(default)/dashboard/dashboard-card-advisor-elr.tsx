"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

export default function DashboardCardAdvisorElr() {
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

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      backgroundColor: isDark ? "#374151" : "#ffffff",
      borderColor: isDark ? "#4B5563" : "#E5E7EB",
      textStyle: {
        color: isDark ? "#F9FAFB" : "#111827",
      },
      formatter: function (params: any) {
        return `${params[0].name}: $${params[0].value.toFixed(2)}`;
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "10%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: [
        "M. Jordan",
        "J. Diezzy",
        "C. Pratt",
        "M. Goodbar",
        "C. Crunch",
        "F. Astair",
        "S. Walton",
        "Y. Bear",
        "J. Doe",
      ],
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 200,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: "${value}",
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
        name: "Repair ELR",
        type: "bar",
        data: [
          150.12, 145.5, 142.3, 140.8, 138.9, 135.2, 119.99, 132.4, 128.75,
        ],
        itemStyle: {
          color: "#3B82F6",
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: "60%",
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Advisor Summary ELR
          </h2>
          <EditMenu align="right" />
        </header>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <option>Repair ELR</option>
              <option>Parts ELR</option>
              <option>Total ELR</option>
            </select>
          </div>
          <div className="flex items-center text-sm font-medium text-red-700 px-2 py-1 bg-red-500/20 rounded-full">
            <span className="mr-1">↓</span>
            $141.64
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
