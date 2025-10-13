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
        fontSize: 20,
        color: isDark ? "#ffffff" : "#000000",
      },
      value: value,
      label: {
        formatter({ value }: { value: number }) {
          // Add appropriate symbol to the value based on gauge type
          if (name.includes("GP %")) {
            return `${value.toFixed(0)}%`;
          } else if (name.includes("$/RO")) {
            return `$${value.toFixed(0)}`;
          } else if (name.includes("Hrs/RO")) {
            return `${value.toFixed(2)}`;
          } else if (name.includes("ELR")) {
            return `$${value.toFixed(0)}`;
          }
          return `${value.toFixed(0)}`;
        },
      },
      startAngle: 270,
      endAngle: 540,
      tooltip: {
        enabled: true,
        renderer: ({ value }: { value: number }) => {
          // Determine status and risk based on zones
          let status, risk, zoneInfo;

          if (value <= redZone[1]) {
            status = "BELOW TARGET";
            risk = "HIGH RISK";
            zoneInfo = `Red Zone (${redZone[0]} - ${redZone[1]})`;
          } else if (value <= yellowZone[1]) {
            status = "WITHIN RANGE";
            risk = "MODERATE RISK";
            zoneInfo = `Yellow Zone (${yellowZone[0]} - ${yellowZone[1]})`;
          } else {
            status = "EXCEEDING TARGET";
            risk = "SAFE";
            zoneInfo = `Green Zone (${greenZone[0]} - ${greenZone[1]})`;
          }

          // Format value based on gauge type
          let formattedValue;
          if (name.includes("GP %")) {
            formattedValue = `${value.toFixed(0)}%`;
          } else if (name.includes("$/RO")) {
            formattedValue = `$${value.toFixed(0)}`;
          } else if (name.includes("Hrs/RO")) {
            formattedValue = `${value.toFixed(2)}`;
          } else if (name.includes("ELR")) {
            formattedValue = `$${value.toFixed(0)}`;
          } else {
            formattedValue = value.toString();
          }

          return {
            heading: name,
            title: formattedValue,
            data: [
              { label: "Status", value: status },
              { label: "Risk Level", value: risk },
              { label: "Zone", value: zoneInfo },
              { label: "Range", value: `${min} - ${max}` },
            ],
          };
        },
      },
      scale: {
        min: min,
        max: max,
        interval: {
          step: (max - min) / 5, // Dynamic step based on range
        },
        fillOpacity: 0.85,
        label: {
          fontSize: 12,
          color: isDark ? "#ffffff" : "#000000",
          formatter: ({ value }: { value: number }) => {
            // Add appropriate symbol to scale labels based on gauge type
            if (name.includes("GP %")) {
              return `${value.toFixed(0)}%`;
            } else if (name.includes("$/RO")) {
              return `$${value.toFixed(0)}`;
            } else if (name.includes("Hrs/RO")) {
              return value.toFixed(2);
            } else if (name.includes("ELR")) {
              return `$${value.toFixed(0)}`;
            }
            return value.toString();
          },
        },
      },
      segmentation: {
        interval: {
          values: [35, 55, 85],
        },
      },
      bar: {
        fillOpacity: 0.8,
        fills: [
          { color: "#ef5452" },
          { color: "#F38B06" },
          { color: "#e1cc00" },
          { color: "#92B83C" },
          { color: "#459d55" },
        ],
      },
      innerRadiusRatio: 0.8,
      cornerRadius: 40,
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
