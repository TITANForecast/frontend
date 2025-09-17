"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

export default function DashboardCardTechnicianProduction() {
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
      max: 1250,
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
      data: [
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
        data: [
          800, 650, 580, 520, 480, 450, 420, 380, 350, 320, 300, 280, 250, 220,
          180,
        ],
        itemStyle: {
          color: "#3B82F6",
        },
      },
      {
        name: "Warranty",
        type: "bar",
        stack: "total",
        data: [
          200, 180, 160, 140, 120, 100, 90, 80, 70, 60, 50, 45, 40, 35, 30,
        ],
        itemStyle: {
          color: "#8B5CF6",
        },
      },
      {
        name: "Internal",
        type: "bar",
        stack: "total",
        data: [150, 120, 100, 80, 70, 60, 50, 45, 40, 35, 30, 25, 20, 15, 10],
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
            Hours
          </div>
          <div className="flex items-center text-sm font-medium text-green-700 px-2 py-1 bg-green-500/20 rounded-full">
            <span className="mr-1">↑</span>
            2,773 HRS
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
