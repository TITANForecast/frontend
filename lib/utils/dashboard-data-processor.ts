// Types for Pre-calculated KPI data
export interface KPIResults {
  kpis: {
    effective_labor_rate: {
      value: number;
      unit: string;
    };
    labor_gp_percent: {
      value: number;
      unit: string;
    };
    hrs_per_ro: {
      value: number;
      unit: string;
    };
    labor_per_ro: {
      value: number;
      unit: string;
    };
    customer_pay: {
      total_sale: number;
      labor_sale: number;
      parts_sale: number;
      gross_profit: number;
    };
    warranty: {
      total_sale: number;
      labor_sale: number;
      parts_sale: number;
      gross_profit: number;
    };
    internal: {
      total_sale: number;
      labor_sale: number;
      parts_sale: number;
      gross_profit: number;
    };
    parts_gp_percent: {
      value: number;
      unit: string;
    };
  };
  metadata: {
    total_repair_orders: number;
  };
}

// Types for DMS Service Data
export interface ServiceRecord {
  "File Type": string;
  "DV Dealer ID": string;
  "Vendor Dealer ID": string;
  "DMS Type": string;
  "RO Number": string;
  "Open Date": string;
  "Closed RO Date": string;
  "Service Advisor Number": string;
  "Service Advisor Name": string;
  "RO Department": string;
  "Total Cost": string;
  "Total Sale": string;
  "Customer Total Cost": string;
  "Customer Total Sale": string;
  "Customer Labor Cost": string;
  "Customer Labor Sale": string;
  "Customer Parts Cost": string;
  "Customer Parts Sale": string;
  "Warranty Total Cost": string;
  "Warranty Total Sale": string;
  "Warranty Labor Cost": string;
  "Warranty Labor Sale": string;
  "Warranty Parts Cost": string;
  "Warranty Parts Sale": string;
  "Internal Total Cost": string;
  "Internal Total Sale": string;
  "Internal Labor Cost": string;
  "Internal Labor Sale": string;
  "Internal Parts Cost": string;
  "Internal Parts Sale": string;
  [key: string]: any;
}

export interface DMSData {
  requestId: string;
  message: string;
  pageSize: number;
  totalRecords: number;
  totalRecordsInPage: number;
  records: ServiceRecord[];
}

export interface ProcessedDashboardData {
  kpis: {
    laborGPPercent: number;
    laborPerRO: number;
    hoursPerRO: number;
    elrTotal: number;
  };
  grossProfit: {
    months: string[];
    customerPay: number[];
    warranty: number[];
    internal: number[];
  };
  roCount: {
    months: string[];
    customerPay: number[];
    warranty: number[];
    internal: number[];
  };
  warranty: {
    currentLaborRate: number;
    trackingPotentialHours: number;
    currentPartsGP: number;
    trackingPotentialPartsGP: number;
  };
  technicians: {
    names: string[];
    customerPay: number[];
    warranty: number[];
    internal: number[];
  };
  advisors: {
    names: string[];
    elr: number[];
  };
  opcodes: {
    labels: string[];
    values: number[];
  };
}

// Helper function to parse currency strings
function parseCurrency(value: string): number {
  if (!value || value === "") return 0;
  return parseFloat(value.replace(/,/g, "")) || 0;
}

// Helper function to parse date strings (MM/DD/YYYY)
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "") return null;
  const [month, day, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

// Helper function to get day label from date (e.g., "Jul 2", "Jul 3")
function getDayLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

// Helper function to get month name from date (kept for backward compatibility)
function getMonthName(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

// Main data processor
export function processDashboardData(
  dmsData: DMSData,
  kpiResults?: KPIResults | null
): ProcessedDashboardData {
  const records = dmsData.records || [];

  // Initialize month buckets for 12 months
  const monthlyData = new Map<
    string,
    {
      customerPayCount: number;
      warrantyCount: number;
      internalCount: number;
      customerPayGP: number;
      warrantyGP: number;
      internalGP: number;
      totalLaborHours: number;
      totalLaborSale: number;
    }
  >();

  // Process each record
  records.forEach((record) => {
    // Use Closed RO Date if available, otherwise fall back to Open Date
    const closedDate = parseDate(record["Closed RO Date"]);
    const openDate = parseDate(record["Open Date"]);
    const dateToUse = closedDate || openDate;

    if (!dateToUse) return;

    // Group by day instead of month for more granular data
    const dayKey = getDayLabel(dateToUse);

    if (!monthlyData.has(dayKey)) {
      monthlyData.set(dayKey, {
        customerPayCount: 0,
        warrantyCount: 0,
        internalCount: 0,
        customerPayGP: 0,
        warrantyGP: 0,
        internalGP: 0,
        totalLaborHours: 0,
        totalLaborSale: 0,
      });
    }

    const monthData = monthlyData.get(dayKey)!;

    // Customer Pay
    const customerSale = parseCurrency(record["Customer Total Sale"]);
    const customerCost = parseCurrency(record["Customer Total Cost"]);
    if (customerSale > 0) {
      monthData.customerPayCount++;
      monthData.customerPayGP +=
        ((customerSale - customerCost) / customerSale) * 100;
    }

    // Warranty
    const warrantySale = parseCurrency(record["Warranty Total Sale"]);
    const warrantyCost = parseCurrency(record["Warranty Total Cost"]);
    if (warrantySale > 0) {
      monthData.warrantyCount++;
      monthData.warrantyGP +=
        ((warrantySale - warrantyCost) / warrantySale) * 100;
    }

    // Internal
    const internalSale = parseCurrency(record["Internal Total Sale"]);
    const internalCost = parseCurrency(record["Internal Total Cost"]);
    if (internalSale > 0) {
      monthData.internalCount++;
      monthData.internalGP +=
        ((internalSale - internalCost) / internalSale) * 100;
    }

    // Labor metrics
    const laborSale =
      parseCurrency(record["Customer Labor Sale"]) +
      parseCurrency(record["Warranty Labor Sale"]) +
      parseCurrency(record["Internal Labor Sale"]);
    monthData.totalLaborSale += laborSale;
  });

  // Calculate KPIs - use pre-calculated values if available, otherwise calculate from raw data
  let laborGPPercent: number;
  let laborPerRO: number;
  let hoursPerRO: number;
  let elrTotal: number;

  // Always calculate from filtered data when records are available
  // Use pre-calculated KPIs only when no filtered data is available
  const totalRecords = records.length;
  const totalLaborCost = records.reduce(
    (sum, r) =>
      sum +
      parseCurrency(r["Customer Labor Cost"]) +
      parseCurrency(r["Warranty Labor Cost"]) +
      parseCurrency(r["Internal Labor Cost"]),
    0
  );
  const totalLaborSale = records.reduce(
    (sum, r) =>
      sum +
      parseCurrency(r["Customer Labor Sale"]) +
      parseCurrency(r["Warranty Labor Sale"]) +
      parseCurrency(r["Internal Labor Sale"]),
    0
  );

  if (totalRecords > 0 && totalLaborSale > 0) {
    // Calculate from filtered data
    laborGPPercent =
      totalLaborSale > 0
        ? ((totalLaborSale - totalLaborCost) / totalLaborSale) * 100
        : 0;
    laborPerRO = totalLaborSale / totalRecords;
    
    // Debug logging
    console.log(`📊 Calculating KPIs from filtered data:`, {
      totalRecords,
      totalLaborSale,
      totalLaborCost,
      laborGPPercent,
      laborPerRO,
      hasKpiResults: !!kpiResults,
    });

    // Calculate ELR (Effective Labor Rate) from customer pay labor sales
    // ELR is typically calculated as total labor sales / total labor hours
    // Since we don't have hours data, we'll estimate based on customer pay labor
    const customerPayLaborSale = records.reduce(
      (sum, r) => sum + parseCurrency(r["Customer Labor Sale"]),
      0
    );
    const customerPayLaborCost = records.reduce(
      (sum, r) => sum + parseCurrency(r["Customer Labor Cost"]),
      0
    );

    // Count customer pay ROs (ROs with customer pay labor)
    const customerPayROs = records.filter(
      (r) => parseCurrency(r["Customer Labor Sale"]) > 0
    ).length;

    if (customerPayLaborSale > 0 && customerPayROs > 0) {
      // Calculate ELR as average customer pay labor sale per RO
      // This gives us an effective rate per repair order
      // For a more accurate ELR, we'd need actual hours data
      elrTotal = customerPayLaborSale / customerPayROs;
    } else if (totalRecords > 0) {
      // Fallback: use average total labor sale per RO
      elrTotal = totalLaborSale / totalRecords;
    } else {
      // Final fallback: use pre-calculated value if available
      elrTotal = kpiResults?.kpis?.effective_labor_rate?.value || 177.5;
    }

    // Hours per RO - would need actual hours data, use pre-calculated if available
    hoursPerRO = kpiResults?.kpis?.hrs_per_ro?.value || 1.29;
  } else if (kpiResults && kpiResults.kpis) {
    // Use pre-calculated KPI values when no filtered data available
    console.log(`⚠️ Using pre-calculated KPIs (no filtered data available)`);
    laborGPPercent = kpiResults.kpis.labor_gp_percent.value;
    laborPerRO = kpiResults.kpis.labor_per_ro.value;
    hoursPerRO = kpiResults.kpis.hrs_per_ro.value;
    elrTotal = kpiResults.kpis.effective_labor_rate.value;
  } else {
    // Fallback defaults
    console.log(`⚠️ Using fallback defaults (no data available)`);
    laborGPPercent = 0;
    laborPerRO = 0;
    hoursPerRO = 1.29;
    elrTotal = 177.5;
  }

  // Prepare daily charts data (sorted by date)
  const sortedDays = Array.from(monthlyData.keys()).sort((a, b) => {
    // Parse dates like "Jul 2", "Jul 3" for proper sorting
    const dateA = new Date(`${a} 2024`);
    const dateB = new Date(`${b} 2024`);
    return dateA.getTime() - dateB.getTime();
  });

  const grossProfitData = {
    months: sortedDays,
    customerPay: sortedDays.map((d) => {
      const data = monthlyData.get(d)!;
      return data.customerPayCount > 0
        ? data.customerPayGP / data.customerPayCount
        : 0;
    }),
    warranty: sortedDays.map((d) => {
      const data = monthlyData.get(d)!;
      return data.warrantyCount > 0 ? data.warrantyGP / data.warrantyCount : 0;
    }),
    internal: sortedDays.map((d) => {
      const data = monthlyData.get(d)!;
      return data.internalCount > 0 ? data.internalGP / data.internalCount : 0;
    }),
  };

  const roCountData = {
    months: sortedDays,
    customerPay: sortedDays.map((d) => monthlyData.get(d)!.customerPayCount),
    warranty: sortedDays.map((d) => monthlyData.get(d)!.warrantyCount),
    internal: sortedDays.map((d) => monthlyData.get(d)!.internalCount),
  };

  // Aggregate technician data
  const technicianMap = new Map<
    string,
    {
      customerPay: number;
      warranty: number;
      internal: number;
    }
  >();

  records.forEach((record) => {
    const techName = record["Service Advisor Name"] || "Unknown";
    if (!technicianMap.has(techName)) {
      technicianMap.set(techName, { customerPay: 0, warranty: 0, internal: 0 });
    }

    const tech = technicianMap.get(techName)!;
    // Convert labor sales to hours by dividing by effective labor rate
    const laborRate = elrTotal > 0 ? elrTotal : 100; // Fallback to $100/hr if ELR not available
    tech.customerPay +=
      parseCurrency(record["Customer Labor Sale"]) / laborRate;
    tech.warranty += parseCurrency(record["Warranty Labor Sale"]) / laborRate;
    tech.internal += parseCurrency(record["Internal Labor Sale"]) / laborRate;
  });

  // Get top 15 technicians by total production
  const sortedTechs = Array.from(technicianMap.entries())
    .sort((a, b) => {
      const totalA = a[1].customerPay + a[1].warranty + a[1].internal;
      const totalB = b[1].customerPay + b[1].warranty + b[1].internal;
      return totalB - totalA;
    })
    .slice(0, 15);

  // Aggregate advisor ELR data
  const advisorMap = new Map<string, { totalSale: number; count: number }>();

  records.forEach((record) => {
    const advisorName = record["Service Advisor Name"] || "Unknown";
    if (!advisorMap.has(advisorName)) {
      advisorMap.set(advisorName, { totalSale: 0, count: 0 });
    }

    const advisor = advisorMap.get(advisorName)!;
    advisor.totalSale += parseCurrency(record["Customer Labor Sale"]);
    advisor.count++;
  });

  // Get top 9 advisors by ELR
  const sortedAdvisors = Array.from(advisorMap.entries())
    .map(([name, data]) => ({
      name,
      elr: data.count > 0 ? data.totalSale / data.count : 0,
    }))
    .sort((a, b) => b.elr - a.elr)
    .slice(0, 9);

  // Aggregate opcode data (would need actual opcode field in data)
  // For now, using mock data structure
  const opcodeData = {
    labels: ["MA10", "FS02", "DIAG", "99P", "BG44K"],
    values: [35, 25, 20, 15, 5],
  };

  return {
    kpis: {
      laborGPPercent: Number(laborGPPercent.toFixed(1)),
      laborPerRO: Number(laborPerRO.toFixed(2)),
      hoursPerRO,
      elrTotal,
    },
    grossProfit: {
      months: grossProfitData.months,
      customerPay: grossProfitData.customerPay.map((v) => Number(v.toFixed(1))),
      warranty: grossProfitData.warranty.map((v) => Number(v.toFixed(1))),
      internal: grossProfitData.internal.map((v) => Number(v.toFixed(1))),
    },
    roCount: roCountData,
    warranty: {
      currentLaborRate: 166.59,
      trackingPotentialHours: 175.42,
      currentPartsGP: 67,
      trackingPotentialPartsGP: 69,
    },
    technicians: {
      names: sortedTechs.map(([name]) => name),
      customerPay: sortedTechs.map(([, data]) =>
        Number(data.customerPay.toFixed(1))
      ),
      warranty: sortedTechs.map(([, data]) => Number(data.warranty.toFixed(1))),
      internal: sortedTechs.map(([, data]) => Number(data.internal.toFixed(1))),
    },
    advisors: {
      names: sortedAdvisors.map((a) => a.name),
      elr: sortedAdvisors.map((a) => Number(a.elr.toFixed(2))),
    },
    opcodes: opcodeData,
  };
}
