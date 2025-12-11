import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/reports/opcode-performance-summary
 * Fetch Opcode Performance Summary with KPIs and groupable dimensions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const payTypes = searchParams.get("payTypes"); // Comma-separated: C,W,I
    const warrantyEligibility = searchParams.get("warrantyEligibility"); // yes, no, unset, all

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    const auth = await requireDealerAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Build WHERE clause
    const escapedDealerId = dealerId.replace(/'/g, "''");
    let whereConditions = [`sr.dealer_id = '${escapedDealerId}'`];

    if (startDate && startDate.trim() !== "") {
      const escapedStartDate = startDate.replace(/'/g, "''");
      whereConditions.push(`sr.open_date >= '${escapedStartDate}'`);
    }

    if (endDate && endDate.trim() !== "") {
      const escapedEndDate = endDate.replace(/'/g, "''");
      whereConditions.push(`sr.open_date <= '${escapedEndDate}'`);
    }

    // Build pay type filter (operation.sale_type, not pay_type)
    if (payTypes && payTypes.trim() !== "") {
      const payTypeArray = payTypes
        .split(",")
        .map((pt) => {
          const trimmed = pt.trim();
          if (trimmed === "") return null;
          const escaped = trimmed.replace(/'/g, "''");
          return `'${escaped}'`;
        })
        .filter((pt) => pt !== null);
      if (payTypeArray.length > 0) {
        whereConditions.push(`o.sale_type IN (${payTypeArray.join(",")})`);
      }
    }

    // Build warranty eligibility filter
    if (warrantyEligibility && warrantyEligibility !== "all") {
      if (warrantyEligibility === "yes") {
        whereConditions.push(`o.is_warranty_eligible = true`);
      } else if (warrantyEligibility === "no") {
        whereConditions.push(`o.is_warranty_eligible = false`);
      } else if (warrantyEligibility === "unset") {
        whereConditions.push(`o.is_warranty_eligible IS NULL`);
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Main query to fetch operation-level data grouped by opcode
    // Returns one row per operation, with opcode and RO-level fields included
    const query = `
      WITH operation_aggregates AS (
        SELECT 
          o.id as operation_id,
          COALESCE(o.operation_code, 'N/A') as opcode,
          COALESCE(o.operation_description, '') as opcode_description,
          sr.id as service_record_id,
          sr.ro_number,
          sr.open_date as ro_date,
          sr.service_advisor_name as advisor,
          sr.ro_mileage,
          COALESCE(v.make, 'Unknown') as make,
          COALESCE(v.model, 'Unknown') as model,
          
          -- Operation-level labor metrics
          COALESCE(SUM(l.labor_bill_hours), 0) as labor_hours,
          COALESCE(SUM(l.labor_sale), 0) as labor_revenue,
          COALESCE(SUM(l.labor_cost), 0) as labor_cost,
          
          -- Operation-level parts metrics
          COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) as parts_revenue,
          COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as parts_cost,
          
          -- Mileage band calculation
          CASE 
            WHEN sr.ro_mileage IS NULL THEN 'Unknown'
            WHEN sr.ro_mileage >= 0 AND sr.ro_mileage < 10000 THEN '1-10k'
            WHEN sr.ro_mileage >= 10000 AND sr.ro_mileage < 20000 THEN '10-20k'
            WHEN sr.ro_mileage >= 20000 AND sr.ro_mileage < 30000 THEN '20-30k'
            WHEN sr.ro_mileage >= 30000 AND sr.ro_mileage < 40000 THEN '30-40k'
            WHEN sr.ro_mileage >= 40000 AND sr.ro_mileage < 50000 THEN '40-50k'
            WHEN sr.ro_mileage >= 50000 AND sr.ro_mileage < 60000 THEN '50-60k'
            WHEN sr.ro_mileage >= 60000 AND sr.ro_mileage < 70000 THEN '60-70k'
            WHEN sr.ro_mileage >= 70000 AND sr.ro_mileage < 80000 THEN '70-80k'
            WHEN sr.ro_mileage >= 80000 AND sr.ro_mileage < 90000 THEN '80-90k'
            WHEN sr.ro_mileage >= 90000 AND sr.ro_mileage < 100000 THEN '90-100k'
            WHEN sr.ro_mileage >= 100000 AND sr.ro_mileage < 110000 THEN '100-110k'
            WHEN sr.ro_mileage >= 110000 AND sr.ro_mileage < 120000 THEN '110-120k'
            WHEN sr.ro_mileage >= 120000 AND sr.ro_mileage < 130000 THEN '120-130k'
            WHEN sr.ro_mileage >= 130000 AND sr.ro_mileage < 140000 THEN '130-140k'
            WHEN sr.ro_mileage >= 140000 AND sr.ro_mileage < 150000 THEN '140-150k'
            ELSE '150k+'
          END as mileage_band
          
        FROM service_record sr
        INNER JOIN vehicle v ON sr.vehicle_id = v.id
        INNER JOIN operation o ON o.service_record_id = sr.id
        LEFT JOIN labor_line l ON o.id = l.operation_id
        LEFT JOIN parts_line p ON o.id = p.operation_id
        ${whereClause}
        GROUP BY 
          o.id,
          o.operation_code,
          o.operation_description,
          sr.id, 
          sr.ro_number, 
          sr.open_date, 
          sr.service_advisor_name, 
          sr.ro_mileage, 
          v.make, 
          v.model
      ),
      grand_totals AS (
        SELECT 
          SUM(labor_revenue + parts_revenue) as grand_total_revenue
        FROM operation_aggregates
      )
      SELECT 
        operation_id,
        opcode,
        opcode_description,
        service_record_id,
        ro_number,
        ro_date,
        advisor,
        ro_mileage,
        make,
        model,
        labor_hours,
        labor_revenue,
        labor_cost,
        parts_revenue,
        parts_cost,
        mileage_band,
        
        -- Sales % = (operation total revenue / grand total revenue) * 100
        CASE 
          WHEN grand_totals.grand_total_revenue > 0
          THEN ((labor_revenue + parts_revenue) / grand_totals.grand_total_revenue) * 100
          ELSE 0
        END as sales_percent
        
      FROM operation_aggregates
      CROSS JOIN grand_totals
      ORDER BY opcode, ro_date DESC, ro_number DESC
      LIMIT 10000;
    `;

    console.log(
      "Opcode Performance Summary Query:",
      query.substring(0, 500) + "..."
    );

    const results = await prisma.$queryRawUnsafe<any[]>(query);

    // Process results to ensure proper number formatting and calculate derived metrics
    const processedResults = results.map((row) => {
      const laborHours = parseFloat(String(row.labor_hours || 0));
      const laborRevenue = parseFloat(String(row.labor_revenue || 0));
      const laborCost = parseFloat(String(row.labor_cost || 0));
      const partsRevenue = parseFloat(String(row.parts_revenue || 0));
      const partsCost = parseFloat(String(row.parts_cost || 0));

      // Calculate derived metrics
      const laborGpPercent =
        laborRevenue > 0
          ? ((laborRevenue - laborCost) / laborRevenue) * 100
          : 0;

      const partsGpPercent =
        partsRevenue > 0
          ? ((partsRevenue - partsCost) / partsRevenue) * 100
          : 0;

      const elr = laborHours > 0 ? laborRevenue / laborHours : 0;

      const discountPercent =
        laborHours > 0 && laborRevenue > 0 ? 100.0 - (elr / 150.0) * 100.0 : 0;

      return {
        operation_id: row.operation_id?.toString() || "",
        opcode: row.opcode || "N/A",
        opcode_description: row.opcode_description || "",
        service_record_id: row.service_record_id?.toString() || "",
        ro_number: row.ro_number || "",
        ro_date: row.ro_date,
        advisor: row.advisor || "Unknown",
        ro_mileage: parseFloat(String(row.ro_mileage || 0)),
        make: row.make || "Unknown",
        model: row.model || "Unknown",
        mileage_band: row.mileage_band || "Unknown",

        // Metrics - each operation counts as 1 (will aggregate when grouped)
        ro_count: 1,
        sales_percent: parseFloat(String(row.sales_percent || 0)),
        labor_hours: laborHours,
        labor_revenue: laborRevenue,
        labor_rev_per_ro: laborRevenue, // Same as labor_revenue for single operation
        labor_gp_percent: laborGpPercent,
        parts_revenue: partsRevenue,
        parts_gp_percent: partsGpPercent,
        elr: elr,
        discount_percent: discountPercent,
      };
    });

    return jsonResponse({
      success: true,
      data: processedResults,
      total: processedResults.length,
    });
  } catch (error: any) {
    console.error("Error fetching Opcode Performance Summary:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Opcode Performance Summary",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
