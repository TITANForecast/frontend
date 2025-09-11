"use client";

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const EChartsDemo = () => {
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

  // Sample data for charts
  const salesData = [
    { month: 'Jan', sales: 820, forecast: 900, target: 850 },
    { month: 'Feb', sales: 932, forecast: 1000, target: 950 },
    { month: 'Mar', sales: 901, forecast: 950, target: 920 },
    { month: 'Apr', sales: 934, forecast: 980, target: 960 },
    { month: 'May', sales: 1290, forecast: 1200, target: 1100 },
    { month: 'Jun', sales: 1330, forecast: 1300, target: 1250 },
  ];

  const regionData = [
    { name: 'North America', value: 35 },
    { name: 'Europe', value: 28 },
    { name: 'Asia Pacific', value: 22 },
    { name: 'Latin America', value: 10 },
    { name: 'Middle East & Africa', value: 5 },
  ];

  // Line chart configuration
  const lineChartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Sales Performance',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151'
      }
    },
    legend: {
      data: ['Actual Sales', 'Forecast', 'Target'],
      textStyle: {
        color: isDark ? '#d1d5db' : '#6b7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: salesData.map(item => item.month),
      axisLine: {
        lineStyle: {
          color: isDark ? '#6b7280' : '#d1d5db'
        }
      },
      axisLabel: {
        color: isDark ? '#d1d5db' : '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDark ? '#6b7280' : '#d1d5db'
        }
      },
      axisLabel: {
        color: isDark ? '#d1d5db' : '#6b7280'
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#f3f4f6'
        }
      }
    },
    series: [
      {
        name: 'Actual Sales',
        type: 'line',
        data: salesData.map(item => item.sales),
        itemStyle: {
          color: '#550000' // Our maroon color
        },
        lineStyle: {
          color: '#550000'
        },
        smooth: true
      },
      {
        name: 'Forecast',
        type: 'line',
        data: salesData.map(item => item.forecast),
        itemStyle: {
          color: '#8470ff' // Violet color from theme
        },
        lineStyle: {
          color: '#8470ff',
          type: 'dashed'
        },
        smooth: true
      },
      {
        name: 'Target',
        type: 'line',
        data: salesData.map(item => item.target),
        itemStyle: {
          color: '#67bfff' // Sky color from theme
        },
        lineStyle: {
          color: '#67bfff',
          type: 'dotted'
        },
        smooth: true
      }
    ]
  };

  // Pie chart configuration
  const pieChartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Revenue by Region',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151'
      },
      formatter: '{a} <br/>{b}: {c}% ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      textStyle: {
        color: isDark ? '#d1d5db' : '#6b7280'
      }
    },
    series: [
      {
        name: 'Revenue',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        data: regionData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          color: function(params: any) {
            const colors = ['#550000', '#774444', '#8b5555', '#a57777', '#c3a5a5'];
            return colors[params.dataIndex % colors.length];
          }
        },
        label: {
          color: isDark ? '#f3f4f6' : '#374151'
        }
      }
    ]
  };

  // Bar chart configuration
  const barChartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Monthly Growth Rate',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151',
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#374151' : '#ffffff',
      borderColor: isDark ? '#6b7280' : '#e5e7eb',
      textStyle: {
        color: isDark ? '#f3f4f6' : '#374151'
      },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: salesData.map(item => item.month),
      axisLine: {
        lineStyle: {
          color: isDark ? '#6b7280' : '#d1d5db'
        }
      },
      axisLabel: {
        color: isDark ? '#d1d5db' : '#6b7280'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: isDark ? '#6b7280' : '#d1d5db'
        }
      },
      axisLabel: {
        color: isDark ? '#d1d5db' : '#6b7280',
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          color: isDark ? '#374151' : '#f3f4f6'
        }
      }
    },
    series: [
      {
        name: 'Growth Rate',
        type: 'bar',
        data: [13.2, 15.8, 12.1, 14.3, 18.7, 16.2],
        itemStyle: {
          color: function(params: any) {
            return params.value > 15 ? '#3ec972' : '#550000'; // Green for high growth, maroon for normal
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ReactECharts 
            option={lineChartOption} 
            style={{ height: '300px' }}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <ReactECharts 
            option={pieChartOption} 
            style={{ height: '300px' }}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>
      </div>

      {/* Bar Chart - Full Width */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <ReactECharts 
          option={barChartOption} 
          style={{ height: '300px' }}
          theme={isDark ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
};

export default EChartsDemo;
