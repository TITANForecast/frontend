"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EditMenu from "@/components/edit-menu";

interface OpcodesData {
  labels: string[];
  values: number[];
}

interface Props {
  data?: OpcodesData;
}

export default function DashboardCardOpcodes({ data }: Props) {
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
    labels: ["MA10", "FS02", "DIAG", "99P", "BG44K"],
    values: [35, 25, 20, 15, 5],
  };

  // Prepare pie chart data
  const colors = ["#3B82F6", "#1E40AF", "#EF4444", "#14B8A6", "#22C55E"];
  const pieData = chartData.labels.map((label, index) => ({
    value: chartData.values[index],
    name: label,
    itemStyle: { color: colors[index % colors.length] },
  }));

  const chartOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: isDark ? "#374151" : "#ffffff",
      borderColor: isDark ? "#4B5563" : "#E5E7EB",
      textStyle: {
        color: isDark ? "#F9FAFB" : "#111827",
      },
    },
    legend: {
      data: chartData.labels,
      bottom: 0,
      textStyle: {
        color: isDark ? "#D1D5DB" : "#6B7280",
      },
    },
    series: [
      {
        name: "Opcodes",
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: isDark ? "#1F2937" : "#ffffff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "16",
            fontWeight: "bold",
            color: isDark ? "#F9FAFB" : "#111827",
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
      },
    ],
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Top 5 Opcodes
          </h2>
          <EditMenu align="right" />
        </header>
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
