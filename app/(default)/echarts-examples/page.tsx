"use client";

import React, { useState } from "react";
import EChartsDemo from "@/components/echarts-demo";
import EChartsComprehensiveDemo from "@/components/echarts-comprehensive-demo";

const EChartsExamplesPage = () => {
  const [activeExample, setActiveExample] = useState("basic");

  const examples = [
    {
      id: "basic",
      title: "Basic Charts",
      description:
        "Essential chart types including line, bar, and pie charts with dark theme support",
      component: EChartsDemo,
    },
    {
      id: "comprehensive",
      title: "Comprehensive Charts",
      description:
        "Advanced chart library with 8 different chart types including area, scatter, radar, gauge, funnel, heatmap, treemap, and sankey diagrams",
      component: EChartsComprehensiveDemo,
    },
  ];

  const ActiveComponent = examples.find(
    (ex) => ex.id === activeExample
  )?.component;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ECharts React Examples
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Comprehensive examples showcasing Apache ECharts capabilities
          including line charts, bar charts, pie charts, scatter plots, radar charts,
          gauge charts, funnel charts, heatmaps, treemaps, and sankey diagrams.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeExample === example.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {example.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Example Description */}
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {examples.find((ex) => ex.id === activeExample)?.title}
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            {examples.find((ex) => ex.id === activeExample)?.description}
          </p>
        </div>
      </div>

      {/* Active Example */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {ActiveComponent && <ActiveComponent />}
      </div>

      {/* Features Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Interactive Features
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Data zoom and pan controls</li>
            <li>• Brush selection tools</li>
            <li>• Rich tooltip interactions</li>
            <li>• Legend toggling and filtering</li>
            <li>• Responsive design</li>
            <li>• Real-time data updates</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Chart Types
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Line & Area charts</li>
            <li>• Bar & Column charts</li>
            <li>• Pie & Doughnut charts</li>
            <li>• Scatter & Bubble plots</li>
            <li>• Radar & Gauge charts</li>
            <li>• Heatmap & Treemap</li>
            <li>• Sankey & Funnel charts</li>
            <li>• And many more...</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Customization Options
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Dark/Light theme support</li>
            <li>• Custom color schemes</li>
            <li>• Animated transitions</li>
            <li>• Custom tooltips and labels</li>
            <li>• Responsive layouts</li>
            <li>• Export functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EChartsExamplesPage;
