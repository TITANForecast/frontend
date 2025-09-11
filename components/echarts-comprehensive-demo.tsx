"use client";

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const EChartsComprehensiveDemo = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeChart, setActiveChart] = useState('line');

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

  // Sample data
  const salesData = [
    { month: 'Jan', sales: 820, forecast: 900, target: 850, profit: 120, cost: 700 },
    { month: 'Feb', sales: 932, forecast: 1000, target: 950, profit: 180, cost: 752 },
    { month: 'Mar', sales: 901, forecast: 950, target: 920, profit: 150, cost: 751 },
    { month: 'Apr', sales: 934, forecast: 980, target: 960, profit: 165, cost: 769 },
    { month: 'May', sales: 1290, forecast: 1200, target: 1100, profit: 280, cost: 1010 },
    { month: 'Jun', sales: 1330, forecast: 1300, target: 1250, profit: 310, cost: 1020 },
    { month: 'Jul', sales: 1420, forecast: 1350, target: 1300, profit: 340, cost: 1080 },
    { month: 'Aug', sales: 1380, forecast: 1400, target: 1350, profit: 320, cost: 1060 },
  ];

  const regionData = [
    { name: 'North America', value: 35, profit: 280 },
    { name: 'Europe', value: 28, profit: 220 },
    { name: 'Asia Pacific', value: 22, profit: 180 },
    { name: 'Latin America', value: 10, profit: 80 },
    { name: 'Middle East & Africa', value: 5, profit: 40 },
  ];

  const productData = [
    { name: 'Product A', sales: 120, cost: 80, profit: 40 },
    { name: 'Product B', sales: 200, cost: 120, profit: 80 },
    { name: 'Product C', sales: 150, cost: 100, profit: 50 },
    { name: 'Product D', sales: 80, cost: 60, profit: 20 },
    { name: 'Product E', sales: 300, cost: 180, profit: 120 },
  ];

  // Scatter plot data
  const scatterData = salesData.map((item, index) => [
    item.sales,
    item.profit,
    index,
    item.month
  ]);

  // Radar chart data
  const radarData = [
    {
      name: 'Q1 Performance',
      value: [85, 78, 92, 88, 76, 90]
    },
    {
      name: 'Q2 Performance', 
      value: [92, 85, 88, 95, 82, 88]
    }
  ];

  // Gauge data
  const gaugeValue = 75;

  // Funnel data
  const funnelData = [
    { value: 100, name: 'Visitors' },
    { value: 80, name: 'Interested' },
    { value: 60, name: 'Inquiry' },
    { value: 40, name: 'Order' },
    { value: 20, name: 'Click' },
    { value: 10, name: 'Purchase' }
  ];

  // Heatmap data
  const heatmapData = [];
  const hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
    '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];
  const days = ['Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday', 'Sunday'];
  
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 24; j++) {
      heatmapData.push([j, i, Math.floor(Math.random() * 100)]);
    }
  }

  // Common theme colors
  const colors = {
    primary: '#550000',
    secondary: '#774444', 
    accent: '#8470ff',
    success: '#3ec972',
    warning: '#f39c12',
    danger: '#e74c3c',
    info: '#67bfff'
  };

  // Common text styles
  const getTextStyle = (size = 16) => ({
    color: isDark ? '#f3f4f6' : '#374151',
    fontSize: size,
    fontWeight: 'bold'
  });

  // Line Chart with Area
  const lineAreaOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Sales Performance with Area Fill',
      textStyle: getTextStyle()
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' }
    },
    legend: {
      data: ['Sales', 'Forecast', 'Target'],
      textStyle: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: salesData.map(item => item.month),
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' },
      splitLine: { lineStyle: { color: isDark ? '#374151' : '#f3f4f6' } }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30,
        bottom: 10
      }
    ],
    series: [
      {
        name: 'Sales',
        type: 'line',
        data: salesData.map(item => item.sales),
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: colors.primary },
        lineStyle: { color: colors.primary },
        smooth: true
      },
      {
        name: 'Forecast',
        type: 'line',
        data: salesData.map(item => item.forecast),
        itemStyle: { color: colors.accent },
        lineStyle: { color: colors.accent, type: 'dashed' },
        smooth: true
      },
      {
        name: 'Target',
        type: 'line',
        data: salesData.map(item => item.target),
        itemStyle: { color: colors.info },
        lineStyle: { color: colors.info, type: 'dotted' },
        smooth: true
      }
    ]
  };

  // Scatter Plot
  const scatterOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Sales vs Profit Correlation',
      textStyle: getTextStyle()
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' },
      formatter: function(params: any) {
        return `${params.data[3]}: Sales $${params.data[0]}K, Profit $${params.data[1]}K`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Sales (K)',
      nameTextStyle: { color: isDark ? '#d1d5db' : '#6b7280' },
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' },
      splitLine: { lineStyle: { color: isDark ? '#374151' : '#f3f4f6' } }
    },
    yAxis: {
      type: 'value',
      name: 'Profit (K)',
      nameTextStyle: { color: isDark ? '#d1d5db' : '#6b7280' },
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' },
      splitLine: { lineStyle: { color: isDark ? '#374151' : '#f3f4f6' } }
    },
    series: [
      {
        name: 'Sales vs Profit',
        type: 'scatter',
        data: scatterData,
        symbolSize: function(data: any) {
          return Math.sqrt(data[2]) * 8 + 5;
        },
        itemStyle: {
          color: colors.primary,
          opacity: 0.7
        },
        emphasis: {
          itemStyle: {
            color: colors.accent,
            borderColor: colors.primary,
            borderWidth: 2
          }
        }
      }
    ]
  };

  // Radar Chart
  const radarOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Performance Metrics Comparison',
      textStyle: getTextStyle()
    },
    tooltip: {
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' }
    },
    legend: {
      data: ['Q1 Performance', 'Q2 Performance'],
      textStyle: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    radar: {
      indicator: [
        { name: 'Sales', max: 100 },
        { name: 'Marketing', max: 100 },
        { name: 'Development', max: 100 },
        { name: 'Customer Service', max: 100 },
        { name: 'Finance', max: 100 },
        { name: 'Operations', max: 100 }
      ],
      name: {
        textStyle: { color: isDark ? '#d1d5db' : '#6b7280' }
      }
    },
    series: [
      {
        name: 'Performance',
        type: 'radar',
        data: radarData,
        itemStyle: {
          color: colors.primary
        },
        areaStyle: {
          opacity: 0.2
        }
      }
    ]
  };

  // Gauge Chart
  const gaugeOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Performance Gauge',
      textStyle: getTextStyle()
    },
    series: [
      {
        name: 'Performance',
        type: 'gauge',
        progress: {
          show: true,
          width: 18
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: isDark ? '#f3f4f6' : '#374151',
          fontSize: 20
        },
        data: [
          {
            value: gaugeValue,
            name: 'Completion Rate',
            title: {
              offsetCenter: ['0%', '-30%'],
              color: isDark ? '#d1d5db' : '#6b7280'
            },
            detail: {
              offsetCenter: ['0%', '-10%']
            }
          }
        ],
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          distance: -30,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: isDark ? '#6b7280' : '#d1d5db'
          }
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            width: 4,
            color: isDark ? '#6b7280' : '#d1d5db'
          }
        },
        axisLabel: {
          color: isDark ? '#d1d5db' : '#6b7280',
          fontSize: 12,
          distance: -60,
          rotate: 'tangential',
          formatter: function(value: number) {
            if (value === 87.5) {
              return 'Grade A';
            } else if (value === 62.5) {
              return 'Grade B';
            } else if (value === 37.5) {
              return 'Grade C';
            } else if (value === 12.5) {
              return 'Grade D';
            }
            return '';
          }
        }
      }
    ]
  };

  // Funnel Chart
  const funnelOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Sales Funnel',
      textStyle: getTextStyle()
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' },
      formatter: '{a} <br/>{b}: {c}%'
    },
    legend: {
      data: funnelData.map(item => item.name),
      textStyle: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    series: [
      {
        name: 'Funnel',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          color: isDark ? '#f3f4f6' : '#374151'
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid'
          }
        },
        itemStyle: {
          borderColor: isDark ? '#374151' : '#ffffff',
          borderWidth: 1
        },
        emphasis: {
          label: {
            fontSize: 20
          }
        },
        data: funnelData
      }
    ]
  };

  // Heatmap
  const heatmapOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Weekly Activity Heatmap',
      textStyle: getTextStyle()
    },
    tooltip: {
      position: 'top',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' },
      formatter: function(params: any) {
        return `${days[params.data[1]]} ${hours[params.data[0]]}<br/>Activity: ${params.data[2]}`;
      }
    },
    grid: {
      height: '50%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true
      },
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true
      },
      axisLine: { lineStyle: { color: isDark ? '#6b7280' : '#d1d5db' } },
      axisLabel: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      textStyle: { color: isDark ? '#d1d5db' : '#6b7280' }
    },
    series: [
      {
        name: 'Activity',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          color: isDark ? '#f3f4f6' : '#374151'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  // Treemap
  const treemapOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Product Sales Treemap',
      textStyle: getTextStyle()
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' }
    },
    series: [
      {
        name: 'Products',
        type: 'treemap',
        data: productData.map(item => ({
          name: item.name,
          value: item.sales,
          itemStyle: {
            color: item.profit > 60 ? colors.success : item.profit > 30 ? colors.info : colors.warning
          }
        })),
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false
        },
        label: {
          show: true,
          formatter: '{b}\n{c}',
          color: isDark ? '#f3f4f6' : '#374151'
        },
        upperLabel: {
          show: true,
          height: 30,
          color: isDark ? '#f3f4f6' : '#374151'
        },
        itemStyle: {
          borderColor: isDark ? '#374151' : '#ffffff'
        },
        emphasis: {
          focus: 'descendant'
        }
      }
    ]
  };

  // Sankey Diagram
  const sankeyData = {
    nodes: [
      { name: 'Website' },
      { name: 'Mobile App' },
      { name: 'Social Media' },
      { name: 'Email' },
      { name: 'Search' },
      { name: 'Direct' },
      { name: 'Product Page' },
      { name: 'Checkout' },
      { name: 'Purchase' },
      { name: 'Cart Abandon' }
    ],
    links: [
      { source: 'Website', target: 'Product Page', value: 100 },
      { source: 'Mobile App', target: 'Product Page', value: 80 },
      { source: 'Social Media', target: 'Product Page', value: 60 },
      { source: 'Email', target: 'Product Page', value: 40 },
      { source: 'Search', target: 'Product Page', value: 120 },
      { source: 'Direct', target: 'Product Page', value: 30 },
      { source: 'Product Page', target: 'Checkout', value: 200 },
      { source: 'Product Page', target: 'Cart Abandon', value: 230 },
      { source: 'Checkout', target: 'Purchase', value: 150 },
      { source: 'Checkout', target: 'Cart Abandon', value: 50 }
    ]
  };

  const sankeyOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Customer Journey Flow',
      textStyle: getTextStyle()
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: { color: isDark ? '#f3f4f6' : '#374151' }
    },
    series: [
      {
        type: 'sankey',
        data: sankeyData.nodes,
        links: sankeyData.links,
        emphasis: {
          focus: 'adjacency'
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        },
        label: {
          color: isDark ? '#f3f4f6' : '#374151'
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: isDark ? '#374151' : '#ffffff'
        }
      }
    ]
  };

  // Chart descriptions
  const getChartDescription = (chartType: string) => {
    const descriptions: { [key: string]: string } = {
      line: "Interactive line chart with area fill showing sales performance over time. Features data zoom, multiple series, and smooth animations.",
      scatter: "Scatter plot showing correlation between sales and profit. Bubble size represents time progression with interactive tooltips.",
      radar: "Radar chart comparing performance metrics across different dimensions. Perfect for multi-dimensional data analysis.",
      gauge: "Animated gauge chart displaying completion percentage with grade-based color coding and smooth transitions.",
      funnel: "Sales funnel visualization showing customer conversion flow from initial contact to final purchase.",
      heatmap: "Weekly activity heatmap displaying patterns across 24 hours and 7 days with color-coded intensity levels.",
      treemap: "Hierarchical treemap showing product sales distribution with profit-based color coding and nested structure.",
      sankey: "Sankey diagram illustrating customer journey flow from various traffic sources to conversion outcomes."
    };
    return descriptions[chartType] || "Interactive chart with advanced visualization capabilities.";
  };

  const chartOptions = {
    line: { title: 'Line Chart with Area', option: lineAreaOption },
    scatter: { title: 'Scatter Plot', option: scatterOption },
    radar: { title: 'Radar Chart', option: radarOption },
    gauge: { title: 'Gauge Chart', option: gaugeOption },
    funnel: { title: 'Funnel Chart', option: funnelOption },
    heatmap: { title: 'Heatmap', option: heatmapOption },
    treemap: { title: 'Treemap', option: treemapOption },
    sankey: { title: 'Sankey Diagram', option: sankeyOption }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {Object.entries(chartOptions).map(([key, { title }]) => (
              <button
                key={key}
                onClick={() => setActiveChart(key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeChart === key
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Example Description */}
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            {chartOptions[activeChart as keyof typeof chartOptions].title}
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            {getChartDescription(activeChart)}
          </p>
        </div>
      </div>

      {/* Active Chart Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <ReactECharts 
          option={chartOptions[activeChart as keyof typeof chartOptions].option} 
          style={{ height: '500px' }}
          theme={isDark ? 'dark' : 'light'}
        />
      </div>

      {/* Chart Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Interactive Features
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Data zoom and pan</li>
            <li>• Brush selection</li>
            <li>• Tooltip interactions</li>
            <li>• Legend toggling</li>
            <li>• Responsive design</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Chart Types
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Line & Area charts</li>
            <li>• Bar & Column charts</li>
            <li>• Pie & Doughnut charts</li>
            <li>• Scatter & Bubble plots</li>
            <li>• Radar & Gauge charts</li>
            <li>• Heatmap & Treemap</li>
            <li>• Sankey & Funnel charts</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Customization
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Dark/Light theme support</li>
            <li>• Custom color schemes</li>
            <li>• Animated transitions</li>
            <li>• Custom tooltips</li>
            <li>• Responsive layouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EChartsComprehensiveDemo;
