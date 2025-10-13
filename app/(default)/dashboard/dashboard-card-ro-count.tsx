"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

interface ROCountData {
  months: string[];
  customerPay: number[];
  warranty: number[];
  internal: number[];
}

interface Props {
  data?: ROCountData;
}

export default function DashboardCardRoCount({ data }: Props) {
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
    months: ["Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
             "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025"],
    customerPay: [680, 720, 700, 750, 780, 770, 720, 730, 740, 750, 760, 740],
    warranty: [200, 220, 210, 230, 240, 235, 220, 225, 230, 235, 240, 230],
    internal: [120, 110, 130, 125, 140, 135, 120, 125, 130, 135, 140, 130],
  };

  const totalROs = chartData.customerPay.reduce((a, b, i) => 
    a + b + chartData.warranty[i] + chartData.internal[i], 0
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
      data: ["Internal", "Warranty", "Customer Pay"],
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
        name: "Internal",
        type: "bar",
        stack: "total",
        data: chartData.internal,
        itemStyle: {
          color: "#EF4444",
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
        name: "Customer Pay",
        type: "bar",
        stack: "total",
        data: chartData.customerPay,
        itemStyle: {
          color: "#3B82F6",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            RO Count
          </h2>
          <EditMenu align="right" />
        </header>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            Total ROs
          </div>
          <div className="flex items-center text-sm font-medium text-blue-700 px-2 py-1 bg-blue-500/20 rounded-full">
            {totalROs.toLocaleString()}
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
