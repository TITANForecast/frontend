import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/reports/ro-performance-summary
 * Fetch RO Performance Summary with KPIs and groupable dimensions
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

    // Main query to fetch RO-level data with all metrics aggregated
    // Returns one row per RO, aggregating all operations within that RO
    const query = `
      WITH ro_aggregates AS (
        SELECT 
          sr.id as service_record_id,
          sr.ro_number,
          sr.open_date as ro_date,
          sr.service_advisor_name as advisor,
          sr.ro_mileage,
          v.make,
          v.model,
          
          -- Labor aggregates per RO
          SUM(COALESCE(l.labor_bill_hours, 0)) as total_labor_hours,
          SUM(COALESCE(l.labor_sale, 0)) as total_labor_sale,
          SUM(COALESCE(l.labor_cost, 0)) as total_labor_cost,
          
          -- Parts aggregates per RO
          SUM(COALESCE(p.parts_unit_sale * p.part_quantity, 0)) as total_parts_sale,
          SUM(COALESCE(p.parts_unit_cost * p.part_quantity, 0)) as total_parts_cost,
          
          -- Sales % calculation: percentage of operations that resulted in a sale
          COUNT(DISTINCT o.id) as total_operations,
          COUNT(DISTINCT CASE 
            WHEN COALESCE(l.labor_sale, 0) > 0 OR COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0 
            THEN o.id 
          END) as sold_operations
          
        FROM service_record sr
        LEFT JOIN vehicle v ON sr.vehicle_id = v.id
        LEFT JOIN operation o ON o.service_record_id = sr.id
        LEFT JOIN labor_line l ON o.id = l.operation_id
        LEFT JOIN parts_line p ON o.id = p.operation_id
        ${whereClause}
        GROUP BY sr.id, sr.ro_number, sr.open_date, sr.service_advisor_name, sr.ro_mileage, v.make, v.model
        HAVING COUNT(DISTINCT o.id) > 0
      )
      SELECT 
        service_record_id,
        ro_number,
        ro_date,
        advisor,
        ro_mileage,
        COALESCE(make, 'Unknown') as make,
        COALESCE(model, 'Unknown') as model,
        
        -- Metrics
        1 as ro_count,
        
        -- Sales % = (sold operations / total operations) * 100
        CASE 
          WHEN total_operations > 0 
          THEN (sold_operations::numeric / total_operations::numeric) * 100
          ELSE 0
        END as sales_percent,
        
        total_labor_hours as labor_hours,
        total_labor_sale as labor_revenue,
        total_labor_sale as labor_rev_per_ro,
        
        CASE 
          WHEN total_labor_sale > 0
          THEN ((total_labor_sale - total_labor_cost) / total_labor_sale) * 100
          ELSE 0
        END as labor_gp_percent,
        
        total_parts_sale as parts_revenue,
        
        CASE 
          WHEN total_parts_sale > 0
          THEN ((total_parts_sale - total_parts_cost) / total_parts_sale) * 100
          ELSE 0
        END as parts_gp_percent,
        
        CASE 
          WHEN total_labor_hours > 0
          THEN total_labor_sale / total_labor_hours
          ELSE 0
        END as elr,
        
        -- Discount % - simplified calculation based on effective rate vs standard rate
        CASE 
          WHEN total_labor_hours > 0 AND total_labor_sale > 0
          THEN 100.0 - ((total_labor_sale / total_labor_hours) / 150.0 * 100.0)
          ELSE 0
        END as discount_percent,
        
        -- Mileage band calculation
        CASE 
          WHEN ro_mileage IS NULL THEN 'Unknown'
          WHEN ro_mileage >= 0 AND ro_mileage < 10000 THEN '1-10k'
          WHEN ro_mileage >= 10000 AND ro_mileage < 20000 THEN '10-20k'
          WHEN ro_mileage >= 20000 AND ro_mileage < 30000 THEN '20-30k'
          WHEN ro_mileage >= 30000 AND ro_mileage < 40000 THEN '30-40k'
          WHEN ro_mileage >= 40000 AND ro_mileage < 50000 THEN '40-50k'
          WHEN ro_mileage >= 50000 AND ro_mileage < 60000 THEN '50-60k'
          WHEN ro_mileage >= 60000 AND ro_mileage < 70000 THEN '60-70k'
          WHEN ro_mileage >= 70000 AND ro_mileage < 80000 THEN '70-80k'
          WHEN ro_mileage >= 80000 AND ro_mileage < 90000 THEN '80-90k'
          WHEN ro_mileage >= 90000 AND ro_mileage < 100000 THEN '90-100k'
          WHEN ro_mileage >= 100000 AND ro_mileage < 110000 THEN '100-110k'
          WHEN ro_mileage >= 110000 AND ro_mileage < 120000 THEN '110-120k'
          WHEN ro_mileage >= 120000 AND ro_mileage < 130000 THEN '120-130k'
          WHEN ro_mileage >= 130000 AND ro_mileage < 140000 THEN '130-140k'
          WHEN ro_mileage >= 140000 AND ro_mileage < 150000 THEN '140-150k'
          ELSE '150k+'
        END as mileage_band
        
      FROM ro_aggregates
      ORDER BY ro_date DESC, ro_number DESC
      LIMIT 10000;
    `;

    console.log(
      "RO Performance Summary Query:",
      query.substring(0, 500) + "..."
    );

    const results = await prisma.$queryRawUnsafe<any[]>(query);

    // Process results to ensure proper number formatting
    const processedResults = results.map((row) => ({
      service_record_id: row.service_record_id?.toString() || "",
      ro_number: row.ro_number || "",
      ro_date: row.ro_date,
      advisor: row.advisor || "Unknown",
      ro_mileage: parseFloat(String(row.ro_mileage || 0)),
      make: row.make || "Unknown",
      model: row.model || "Unknown",
      mileage_band: row.mileage_band || "Unknown",

      // Metrics
      ro_count: 1, // Always 1 for ungrouped view (count of ROs)
      sales_percent: parseFloat(String(row.sales_percent || 0)),
      labor_hours: parseFloat(String(row.labor_hours || 0)),
      labor_revenue: parseFloat(String(row.labor_revenue || 0)),
      labor_rev_per_ro: parseFloat(String(row.labor_revenue || 0)), // Same as labor_revenue for single RO
      labor_gp_percent: parseFloat(String(row.labor_gp_percent || 0)),
      parts_revenue: parseFloat(String(row.parts_revenue || 0)),
      parts_gp_percent: parseFloat(String(row.parts_gp_percent || 0)),
      elr: parseFloat(String(row.elr || 0)),
      discount_percent: parseFloat(String(row.discount_percent || 0)),
    }));

    return jsonResponse({
      success: true,
      data: processedResults,
      total: processedResults.length,
    });
  } catch (error: any) {
    console.error("Error fetching RO Performance Summary:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RO Performance Summary",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
