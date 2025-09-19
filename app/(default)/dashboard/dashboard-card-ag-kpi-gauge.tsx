"use client";

import React, { useEffect, useRef, useState } from "react";
import { AgCharts } from "@/lib/ag-charts-license";
import { useAgChartsLoading } from "@/lib/use-ag-charts-license";

interface AGKPIGaugeProps {
  value: number;
  name: string;
  min: number;
  max: number;
  redZone: [number, number];
  yellowZone: [number, number];
  greenZone: [number, number];
  className?: string;
}

export default function DashboardCardAGKPIGauge({
  value,
  name,
  min,
  max,
  redZone,
  yellowZone,
  greenZone,
  className = "col-span-12 md:col-span-6 lg:col-span-3",
}: AGKPIGaugeProps) {
  const [isDark, setIsDark] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const { isLicenseLoaded, LoadingComponent } = useAgChartsLoading();

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

  useEffect(() => {
    // Only create chart if license is loaded
    if (!isLicenseLoaded || !chartRef.current) {
      return;
    }

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Exact options as provided with transparent background and smaller labels
    const options = {
      type: "radial-gauge" as const,
      container: chartRef.current,
      theme: isDark ? ("ag-default-dark" as const) : ("ag-default" as const),
      background: {
        fill: "transparent",
      },
      title: {
        text: name,
        fontSize: 14,
        color: isDark ? "#ffffff" : "#000000",
      },
      value: value,
      startAngle: 270,
      endAngle: 540,
      tooltip: {
        enabled: true,
        renderer: ({ value }: { value: number }) => {
          const status = value >= 70 ? "EXCEEDING LIMIT" : "WITHIN LIMIT";
          const risk =
            value >= 85 ? "HIGH RISK" : value >= 65 ? "MODERATE RISK" : "SAFE";

          return {
            heading: "Current Speed",
            title: `${value} mph`,
            data: [
              { label: "Status", value: status },
              { label: "Risk Level", value: risk },
              { label: "Speed Limit", value: "70 mph" },
              { label: "Safety Zone", value: "≤ 65 mph" },
            ],
          };
        },
      },
      scale: {
        min: min,
        max: max,
        interval: {
          step: 10,
        },
        fillOpacity: 0.85,
        label: {
          fontSize: 10,
          color: isDark ? "#ffffff" : "#000000",
        },
      },
      segmentation: {
        interval: {
          values: [35, 55, 85],
        },
      },
      bar: {
        fillOpacity: 0.8,
      },
      innerRadiusRatio: 0.8,
      secondaryLabel: {
        text: "mph",
        fontSize: 12,
        color: isDark ? "#ffffff" : "#000000",
      },
      cornerRadius: 40,
      targets: [
        {
          value: 70,
          shape: "triangle" as const,
          placement: "inside" as const,
          spacing: 12,
          size: 16,
          strokeWidth: 2,
          text: "LIMIT",
          label: {
            fontSize: 12,
            color: isDark ? "#ffffff" : "#000000",
          },
        },
      ],
    };

    try {
      console.log(`Creating gauge for ${name} - Dark mode: ${isDark}`);
      chartInstance.current = AgCharts.createGauge(options);
    } catch (error) {
      console.error("Failed to create AG Charts gauge:", error);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [value, name, min, max, isDark, isLicenseLoaded]);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {!isLicenseLoaded ? (
        <LoadingComponent height="350px" message="Loading chart..." />
      ) : (
        <div ref={chartRef} style={{ height: "350px", width: "100%" }} />
      )}
    </div>
  );
}
