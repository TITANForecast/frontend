"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

interface KPIGaugeProps {
  value: number;
  name: string;
  min: number;
  max: number;
  redZone: [number, number];
  yellowZone: [number, number];
  greenZone: [number, number];
  className?: string;
}

export default function DashboardCardKPIGauge({
  value,
  name,
  min,
  max,
  redZone,
  yellowZone,
  greenZone,
  className = "col-span-12 md:col-span-6 lg:col-span-3",
}: KPIGaugeProps) {
  const [isDark, setIsDark] = useState(false);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const totalRange = max - min;
  const redZonePercent = ((redZone[1] - redZone[0]) / totalRange) * 100;
  const yellowZonePercent =
    ((yellowZone[1] - yellowZone[0]) / totalRange) * 100;

  const gaugeOption = {
    backgroundColor: "transparent",
    series: [
      {
        name: name,
        type: "gauge",
        center: ["50%", "50%"],
        radius: "70%",
        min: min,
        max: max,
        splitNumber: 5,
        axisLine: {
          lineStyle: {
            width: 25,
            color: [
              [redZonePercent / 100, "#e74c3c"], // Red zone
              [(redZonePercent + yellowZonePercent) / 100, "#f39c12"], // Yellow zone
              [1, "#27ae60"], // Green zone
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: "#3498db", // Blue needle
          },
        },
        axisTick: {
          distance: -15,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: isDark ? "#6b7280" : "#d1d5db",
          },
        },
        splitLine: {
          distance: -15,
          length: 15,
          lineStyle: {
            width: 4,
            color: isDark ? "#6b7280" : "#d1d5db",
          },
        },
        axisLabel: {
          color: isDark ? "#d1d5db" : "#6b7280",
          fontSize: 9,
          distance: -25,
          rotate: "tangential",
          formatter: function (value: number) {
            // Show all labels - ECharts will generate 6 tick marks (0-5 splits)
            return value.toFixed(1);
          },
        },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: isDark ? "#f3f4f6" : "#374151",
          fontSize: 18,
          offsetCenter: [0, "60%"],
        },
        data: [
          {
            value: value,
            name: name,
            title: {
              offsetCenter: ["0%", "-20%"],
              color: isDark ? "#d1d5db" : "#6b7280",
              fontSize: 13,
              fontWeight: "bold",
            },
          },
        ],
      },
    ],
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <ReactECharts
        option={gaugeOption}
        style={{ height: "350px" }}
        theme={isDark ? "dark" : "light"}
      />
    </div>
  );
}
