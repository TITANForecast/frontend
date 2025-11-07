import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma-admin-data";

// Helper to format numbers with commas
function formatNumber(num: any): string {
  if (num === null || num === undefined) return "0.00";
  const numVal = typeof num === "string" ? parseFloat(num) : num;
  return numVal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Helper to format date
function formatDate(date: any): string {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

async function fetchFromDatabase(
  dealerId?: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    // Build WHERE clause conditions
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dealerId) {
      conditions.push(`sr.dealer_id = $${paramIndex}`);
      params.push(dealerId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`sr.open_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      // Add one day to endDate to include records on that date
      const endDateInclusive = new Date(endDate);
      endDateInclusive.setDate(endDateInclusive.getDate() + 1);
      conditions.push(`sr.open_date < $${paramIndex}`);
      params.push(endDateInclusive);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Build query to fetch service records with joins
    const query = `
      SELECT 
        sr.id,
        sr.ro_number,
        sr.dealer_id,
        sr.file_type,
        sr.open_date,
        sr.close_date,
        sr.appointment_date,
        sr.appointment_flag,
        sr.service_advisor_number,
        sr.service_advisor_name,
        sr.ro_department,
        sr.ro_store,
        sr.accounting_make,
        sr.ro_status,
        sr.ro_mileage,
        sr.mileage_out,
        sr.total_cost,
        sr.total_sale,
        
        -- Financial summary data
        fs.customer_total_cost,
        fs.customer_total_sale,
        fs.customer_labor_cost,
        fs.customer_labor_sale,
        fs.customer_parts_cost,
        fs.customer_parts_sale,
        fs.warranty_total_cost,
        fs.warranty_total_sale,
        fs.warranty_labor_cost,
        fs.warranty_labor_sale,
        fs.warranty_parts_cost,
        fs.warranty_parts_sale,
        fs.internal_total_cost,
        fs.internal_total_sale,
        fs.internal_labor_cost,
        fs.internal_labor_sale,
        fs.internal_parts_cost,
        fs.internal_parts_sale,
        fs.total_labor_cost,
        fs.total_labor_sale,
        fs.total_parts_cost,
        fs.total_parts_sale,
        
        -- Customer data
        c.customer_number,
        c.first_name,
        c.last_name,
        c.full_name,
        c.address_line_1,
        c.address_line_2,
        c.city,
        c.state,
        c.zip_code,
        c.home_phone,
        c.cell_phone,
        c.work_phone,
        c.email_1,
        
        -- Vehicle data
        v.vin,
        v.year,
        v.make,
        v.model,
        v.trim,
        v.exterior_color,
        v.license_plate_number
        
      FROM service_record sr
      LEFT JOIN financial_summary fs ON sr.id = fs.service_record_id
      LEFT JOIN customer c ON sr.customer_id = c.id
      LEFT JOIN vehicle v ON sr.vehicle_id = v.id
      ${whereClause}
      ORDER BY sr.open_date DESC, sr.id DESC
      LIMIT 5000;
    `;

    const rawRecords =
      params.length > 0
        ? await prisma.$queryRawUnsafe(query, ...params)
        : await prisma.$queryRawUnsafe(query);

    // Format records to match SV500.json structure
    const formattedRecords = (rawRecords as any[]).map((record: any) => ({
      "File Type": record.file_type || "Service",
      "DV Dealer ID": record.dealer_id || "",
      "Vendor Dealer ID": record.dealer_id || "",
      "DMS Type": "PBS",
      "RO Number": record.ro_number || "",
      "Open Date": formatDate(record.open_date),
      "Closed RO Date": formatDate(record.close_date),
      "Service Advisor Number": record.service_advisor_number || "",
      "Service Advisor Name": record.service_advisor_name || "",
      "RO Department": record.ro_department || "",
      "RO Store": record.ro_store || "",
      "Appointment Date": formatDate(record.appointment_date),
      "Appointment Flag": record.appointment_flag || "",
      "Appointment Number": "",
      "Appointment Department": "",
      "Accounting Make": record.accounting_make || "",
      "Pickup Date": "",
      "Pickup Time": "",
      "Post Time": "",
      "Promise Date": "",
      "Promise Time": "",
      "Payment Method": "",
      "RO Status": record.ro_status || "",
      "Print Time": "",
      "Salesman Name": "",
      "Salesman Number": "",
      "Service Contract Name": "",
      "Service Contract Number": "",
      "Tag Number": "",
      "Warranty Expiration Date": "",
      "Warranty Expiration Miles": "",
      "Total Cost": formatNumber(record.total_cost),
      "Total Sale": formatNumber(record.total_sale),
      "Customer Total Cost": formatNumber(record.customer_total_cost),
      "Customer Total Sale": formatNumber(record.customer_total_sale),
      "Customer Labor Cost": formatNumber(record.customer_labor_cost),
      "Customer Labor Sale": formatNumber(record.customer_labor_sale),
      "Customer Parts Cost": formatNumber(record.customer_parts_cost),
      "Customer Parts Sale": formatNumber(record.customer_parts_sale),
      "Customer Misc Cost": "0.00",
      "Customer Misc Sale": "0.00",
      "Customer Gas/Oil/Grease Cost": "0.00",
      "Customer Gas/Oil/Grease Sale": "0.00",
      "Customer Sublet Cost": "0.00",
      "Customer Sublet Sale": "0.00",
      "Customer Tire Cost": "0.00",
      "Customer Tire Sale": "0.00",
      "Warranty Total Cost": formatNumber(record.warranty_total_cost),
      "Warranty Total Sale": formatNumber(record.warranty_total_sale),
      "Warranty Labor Cost": formatNumber(record.warranty_labor_cost),
      "Warranty Labor Sale": formatNumber(record.warranty_labor_sale),
      "Warranty Parts Cost": formatNumber(record.warranty_parts_cost),
      "Warranty Parts Sale": formatNumber(record.warranty_parts_sale),
      "Warranty Misc Cost": "0.00",
      "Warranty Misc Sale": "0.00",
      "Warranty Gas/Oil/Grease Cost": "0.00",
      "Warranty Gas/Oil/Grease Sale": "0.00",
      "Warranty Sublet Cost": "0.00",
      "Warranty Sublet Sale": "0.00",
      "Warranty Tire Cost": "0.00",
      "Warranty Tire Sale": "0.00",
      "Internal Total Cost": formatNumber(record.internal_total_cost),
      "Internal Total Sale": formatNumber(record.internal_total_sale),
      "Internal Labor Cost": formatNumber(record.internal_labor_cost),
      "Internal Labor Sale": formatNumber(record.internal_labor_sale),
      "Internal Parts Cost": formatNumber(record.internal_parts_cost),
      "Internal Parts Sale": formatNumber(record.internal_parts_sale),
      "Internal Misc Cost": "0.00",
      "Internal Misc Sale": "0.00",
      "Internal Gas/Oil/Grease Cost": "0.00",
      "Internal Gas/Oil/Grease Sale": "0.00",
      "Internal Sublet Cost": "0.00",
      "Internal Sublet Sale": "0.00",
      "Internal Tire Cost": "0.00",
      "Internal Tire Sale": "0.00",
      "Customer Number": record.customer_number || "",
      "Customer First Name": record.first_name || "",
      "Customer Last Name": record.last_name || "",
      "Customer Full Name": record.full_name || "",
      "Customer Address": record.address_line_1 || "",
      "Customer Address 2": record.address_line_2 || "",
      "Customer City": record.city || "",
      "Customer State": record.state || "",
      "Customer Zip": record.zip_code || "",
      "Customer Home Phone": record.home_phone || "",
      "Customer Cell Phone": record.cell_phone || "",
      "Customer Work Phone": record.work_phone || "",
      "Customer Email": record.email_1 || "",
      VIN: record.vin || "",
      Year: record.year || "",
      Make: record.make || "",
      Model: record.model || "",
      Trim: record.trim || "",
      Color: record.exterior_color || "",
      License: record.license_plate_number || "",
      "RO Mileage": record.ro_mileage?.toString() || "",
      "Mileage Out": record.mileage_out?.toString() || "",
    }));

    return {
      requestId: `db-${Date.now()}`,
      message: "Successfully delivered from database",
      pageSize: formattedRecords.length,
      totalRecords: formattedRecords.length,
      totalRecordsInPage: formattedRecords.length,
      records: formattedRecords,
    };
  } catch (error) {
    console.error("Error fetching from database:", error);
    throw error;
  }
}

async function fetchServiceMetrics(dealerId: string) {
  try {
    // Fetch the most recent service metrics for the dealer
    const metrics = await prisma.$queryRaw`
      SELECT 
        effective_labor_rate,
        labor_gp_percent,
        hours_per_ro,
        labor_per_ro,
        customer_pay_revenue,
        customer_pay_gp,
        warranty_revenue,
        warranty_gp,
        internal_revenue,
        internal_gp,
        parts_gp_percent,
        total_repair_orders
      FROM service_metrics 
      WHERE dealer_id = ${dealerId}
      AND period_type = 'monthly'
      ORDER BY metric_date DESC 
      LIMIT 1;
    `;

    if (!metrics || (metrics as any[]).length === 0) {
      console.log(`⚠️  No service metrics found for dealer ${dealerId}`);
      return null;
    }

    const m = (metrics as any[])[0];

    // Format to match KPIResults structure expected by the dashboard
    return {
      kpis: {
        effective_labor_rate: {
          value: parseFloat(m.effective_labor_rate || "0"),
          unit: "$/hr",
        },
        labor_gp_percent: {
          value: parseFloat(m.labor_gp_percent || "0"),
          unit: "%",
        },
        hrs_per_ro: {
          value: parseFloat(m.hours_per_ro || "0"),
          unit: "hrs",
        },
        labor_per_ro: {
          value: parseFloat(m.labor_per_ro || "0"),
          unit: "$",
        },
        customer_pay: {
          total_sale: parseFloat(m.customer_pay_revenue || "0"),
          labor_sale: 0, // Not separately tracked in service_metrics
          parts_sale: 0,
          gross_profit: parseFloat(m.customer_pay_gp || "0"),
        },
        warranty: {
          total_sale: parseFloat(m.warranty_revenue || "0"),
          labor_sale: 0,
          parts_sale: 0,
          gross_profit: parseFloat(m.warranty_gp || "0"),
        },
        internal: {
          total_sale: parseFloat(m.internal_revenue || "0"),
          labor_sale: 0,
          parts_sale: 0,
          gross_profit: parseFloat(m.internal_gp || "0"),
        },
        parts_gp_percent: {
          value: parseFloat(m.parts_gp_percent || "0"),
          unit: "%",
        },
      },
      metadata: {
        total_repair_orders: parseInt(m.total_repair_orders || "0"),
      },
    };
  } catch (error) {
    console.error("Error fetching service metrics:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get dealer ID and date range from query params
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId parameter is required" },
        { status: 400 }
      );
    }

    // Parse date parameters
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    console.log(
      `📊 Fetching data for dealer: ${dealerId}${
        startDate ? ` from ${startDate.toISOString()}` : ""
      }${endDate ? ` to ${endDate.toISOString()}` : ""}`
    );

    // Fetch service records
    const dmsData = await fetchFromDatabase(dealerId, startDate, endDate);

    // Only fetch pre-calculated KPIs if no date range is specified
    // When date range is provided, KPIs should be calculated from filtered data
    let kpiData = null;
    if (!startDate && !endDate) {
      kpiData = await fetchServiceMetrics(dealerId);
    }

    console.log(
      `✅ Retrieved ${dmsData.totalRecords} records for dealer ${dealerId}`
    );
    if (kpiData) {
      console.log(`✅ Retrieved pre-calculated KPIs for dealer ${dealerId}`);
    } else if (startDate || endDate) {
      console.log(
        `📅 Date range provided - KPIs will be calculated from filtered data`
      );
    }

    return NextResponse.json({
      source: `database-dealer-${dealerId}`,
      data: dmsData,
      kpis: kpiData,
    });
  } catch (error) {
    console.error("Error fetching DMS data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
