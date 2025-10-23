"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

interface TechnicianData {
  names: string[];
  customerPay: number[];
  warranty: number[];
  internal: number[];
}

interface Props {
  data?: TechnicianData;
}

export default function DashboardCardTechnicianProduction({ data }: Props) {
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
    names: [
      "H. Ford",
      "K. Benz",
      "G. Kawasaki",
      "E. Ferrari",
      "G. Daimler",
      "S. Honda",
      "K. Toyoda",
      "L. Chevrolet",
      "F. Porsche",
      "R.E. Olds",
      "H. Royce",
      "H. Dodge",
      "F. Dodge",
      "W. Chrysler",
      "G Mason",
    ],
    customerPay: [
      145.5, 125.0, 112.5, 98.0, 89.5, 82.0, 75.5, 68.0, 62.5, 58.0, 52.5, 48.0,
      42.5, 38.0, 32.5,
    ],
    warranty: [
      35.5, 32.0, 28.5, 25.0, 22.5, 19.0, 16.5, 14.5, 12.5, 11.0, 9.5, 8.5, 7.5,
      6.5, 5.5,
    ],
    internal: [
      25.0, 22.0, 19.0, 16.5, 14.5, 12.5, 10.5, 9.0, 7.5, 6.5, 5.5, 4.5, 3.5,
      2.5, 1.5,
    ],
  };

  const totalHours = chartData.customerPay.reduce(
    (a, b, i) => a + b + chartData.warranty[i] + chartData.internal[i],
    0
  );

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
    },
    legend: {
      data: ["Customer Pay", "Warranty", "Internal"],
      bottom: 0,
      textStyle: {
        color: isDark ? "#D1D5DB" : "#6B7280",
      },
    },
    grid: {
      left: "15%",
      right: "4%",
      bottom: "15%",
      top: "10%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      min: 0,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
      },
      splitLine: {
        lineStyle: {
          color: isDark ? "#374151" : "#F3F4F6",
        },
      },
    },
    yAxis: {
      type: "category",
      data: chartData.names,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: isDark ? "#9CA3AF" : "#6B7280",
      },
    },
    series: [
      {
        name: "Customer Pay",
        type: "bar",
        stack: "total",
        data: chartData.customerPay,
        itemStyle: {
          color: "#3B82F6",
        },
      },
      {
        name: "Warranty",
        type: "bar",
        stack: "total",
        data: chartData.warranty,
        itemStyle: {
          color: "#8B5CF6",
        },
      },
      {
        name: "Internal",
        type: "bar",
        stack: "total",
        data: chartData.internal,
        itemStyle: {
          color: "#EF4444",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Technician Production
          </h2>
          <EditMenu align="right" />
        </header>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            Total Hours
          </div>
          <div className="flex items-center text-sm font-medium text-green-700 px-2 py-1 bg-green-500/20 rounded-full">
            <span className="mr-1">↑</span>
            {totalHours.toFixed(0)} HRS
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
