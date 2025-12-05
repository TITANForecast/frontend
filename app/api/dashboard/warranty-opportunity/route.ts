import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";
import { subDays } from "date-fns";

/**
 * GET /api/dashboard/warranty-opportunity
 * Calculate warranty opportunity metrics for dashboard
 * - Current values from dealer general settings
 * - Tracking potential from best 100 ROs in past 180 days (using same logic as RO optimizer)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");

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

    // Fetch general settings for current values
    const generalSettings = await prisma.dealerGeneralSettings.findUnique({
      where: { dealerId },
    });

    const currentLaborRate =
      generalSettings?.currentWarrantyLaborRate !== null &&
      generalSettings?.currentWarrantyLaborRate !== undefined
        ? parseFloat(String(generalSettings.currentWarrantyLaborRate))
        : null;

    const currentPartsMarkup =
      generalSettings?.currentWarrantyPartsMarkup !== null &&
      generalSettings?.currentWarrantyPartsMarkup !== undefined
        ? parseFloat(String(generalSettings.currentWarrantyPartsMarkup))
        : null;

    // Calculate date range: past 180 days (fixed for dashboard)
    const endDate = new Date();
    const startDate = subDays(endDate, 180);

    // Build WHERE clause for RO filtering (same as RO optimizer)
    const escapedDealerId = dealerId.replace(/'/g, "''");
    let whereConditions = [`sr.dealer_id = '${escapedDealerId}'`];

    // Add date range filters (format: YYYY-MM-DD, same as RO optimizer)
    if (startDate) {
      const escapedStartDate = startDate
        .toISOString()
        .split("T")[0]
        .replace(/'/g, "''");
      whereConditions.push(`sr.open_date >= '${escapedStartDate}'`);
    }
    if (endDate) {
      const escapedEndDate = endDate
        .toISOString()
        .split("T")[0]
        .replace(/'/g, "''");
      whereConditions.push(`sr.open_date <= '${escapedEndDate}'`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Use the same query structure as RO optimizer for consistency
    // Query for labor mode (ELR tracking potential)
    const laborQuery = `
      SELECT 
        sr.id as service_record_id,
        sr.ro_number,
        sr.open_date as ro_open_date,
        v.year as vehicle_year,
        v.make as vehicle_make,
        v.model as vehicle_model,
        sr.ro_mileage as vehicle_mileage,
        COALESCE(SUM(l.labor_sale), 0) as total_labor_sale,
        COALESCE(SUM(l.labor_bill_hours), 0) as total_labor_hours,
        COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) as total_parts_sale,
        COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as total_parts_cost,
        -- Eligible operations totals (only eligible operations)
        SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_sale ELSE 0 END) as eligible_labor_sale,
        SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) as eligible_labor_hours,
        CASE 
          WHEN SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) > 0
          THEN SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_sale ELSE 0 END) / 
               SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END)
          ELSE 0
        END as eligible_avg_elr,
        COUNT(DISTINCT CASE WHEN o.is_warranty_eligible = true AND (COALESCE(l.labor_sale, 0) > 0 OR COALESCE(l.labor_bill_hours, 0) > 0) THEN o.id END) as eligible_operations_count
      FROM service_record sr
      INNER JOIN vehicle v ON sr.vehicle_id = v.id
      INNER JOIN operation o ON o.service_record_id = sr.id
      LEFT JOIN labor_line l ON o.id = l.operation_id
      LEFT JOIN parts_line p ON o.id = p.operation_id
      ${whereClause}
      GROUP BY sr.id, sr.ro_number, sr.open_date, v.year, v.make, v.model, sr.ro_mileage
      HAVING 
        -- Must have operations of the selected type
        (
          'labor' = 'labor' AND (COALESCE(SUM(l.labor_sale), 0) > 0 OR COALESCE(SUM(l.labor_bill_hours), 0) > 0)
        )
        -- Must have at least one eligible operation
        AND (
          SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) > 0
        )
        -- Eligible only (always true for dashboard)
        AND BOOL_OR(o.is_warranty_eligible = true AND (COALESCE(l.labor_sale, 0) > 0 OR COALESCE(l.labor_bill_hours, 0) > 0))
      ORDER BY sr.open_date ASC
    `;

    // Query for parts mode (Parts Markup tracking potential)
    const partsQuery = `
      SELECT 
        sr.id as service_record_id,
        sr.ro_number,
        sr.open_date as ro_open_date,
        v.year as vehicle_year,
        v.make as vehicle_make,
        v.model as vehicle_model,
        sr.ro_mileage as vehicle_mileage,
        COALESCE(SUM(l.labor_sale), 0) as total_labor_sale,
        COALESCE(SUM(l.labor_bill_hours), 0) as total_labor_hours,
        COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) as total_parts_sale,
        COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as total_parts_cost,
        -- Eligible operations totals (only eligible operations)
        SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_sale * p.part_quantity ELSE 0 END) as eligible_parts_sale,
        SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END) as eligible_parts_cost,
        CASE 
          WHEN SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END) > 0
          THEN ((SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_sale * p.part_quantity ELSE 0 END) - 
                 SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END)) / 
                SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END)) * 100
          ELSE 0
        END as eligible_avg_parts_markup,
        COUNT(DISTINCT CASE WHEN o.is_warranty_eligible = true AND COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0 THEN o.id END) as eligible_operations_count
      FROM service_record sr
      INNER JOIN vehicle v ON sr.vehicle_id = v.id
      INNER JOIN operation o ON o.service_record_id = sr.id
      LEFT JOIN labor_line l ON o.id = l.operation_id
      LEFT JOIN parts_line p ON o.id = p.operation_id
      ${whereClause}
      GROUP BY sr.id, sr.ro_number, sr.open_date, v.year, v.make, v.model, sr.ro_mileage
      HAVING 
        -- Must have operations of the selected type
        (
          'parts' = 'parts' AND COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) > 0
        )
        -- Must have at least one eligible operation
        AND (
          SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END) > 0
        )
        -- Eligible only (always true for dashboard)
        AND BOOL_OR(o.is_warranty_eligible = true AND COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0)
      ORDER BY sr.open_date ASC
    `;

    // Fetch ROs for both modes
    const laborROs = await prisma.$queryRawUnsafe<any[]>(laborQuery);
    const partsROs = await prisma.$queryRawUnsafe<any[]>(partsQuery);

    // Process ROs same way as RO optimizer
    const processROs = (ros: any[], searchMode: string) => {
      return ros.map((ro: any) => {
        const eligibleLaborSale =
          searchMode === "labor"
            ? parseFloat(String(ro.eligible_labor_sale || 0))
            : 0;
        const eligibleLaborHours =
          searchMode === "labor"
            ? parseFloat(String(ro.eligible_labor_hours || 0))
            : 0;
        const eligiblePartsSale =
          searchMode === "parts"
            ? parseFloat(String(ro.eligible_parts_sale || 0))
            : 0;
        const eligiblePartsCost =
          searchMode === "parts"
            ? parseFloat(String(ro.eligible_parts_cost || 0))
            : 0;

        return {
          eligible_labor_sale: eligibleLaborSale,
          eligible_labor_hours: eligibleLaborHours,
          eligible_parts_sale: eligiblePartsSale,
          eligible_parts_cost: eligiblePartsCost,
        };
      });
    };

    // Calculate tracking potential for labor (ELR) - same logic as RO optimizer
    let trackingPotentialELR: number | null = null;
    if (laborROs.length > 0) {
      const processedROs = processROs(laborROs, "labor");
      const bestSet = findBestContiguousWindow(processedROs, 100, "labor");

      if (bestSet.length > 0) {
        const totalLaborSale = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_labor_sale || 0),
          0
        );
        const totalLaborHours = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_labor_hours || 0),
          0
        );

        trackingPotentialELR =
          totalLaborHours > 0 ? totalLaborSale / totalLaborHours : 0;
      }
    }

    // Calculate tracking potential for parts (Parts Markup %) - same logic as RO optimizer
    let trackingPotentialPartsMarkup: number | null = null;
    if (partsROs.length > 0) {
      const processedROs = processROs(partsROs, "parts");
      const bestSet = findBestContiguousWindow(processedROs, 100, "parts");

      if (bestSet.length > 0) {
        const totalPartsSale = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_parts_sale || 0),
          0
        );
        const totalPartsCost = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_parts_cost || 0),
          0
        );

        trackingPotentialPartsMarkup =
          totalPartsCost > 0
            ? ((totalPartsSale - totalPartsCost) / totalPartsCost) * 100
            : 0;
      }
    }

    return jsonResponse({
      currentLaborRate,
      trackingPotentialELR,
      currentPartsMarkup,
      trackingPotentialPartsMarkup,
      totalEligibleROsLabor: laborROs.length,
      totalEligibleROsParts: partsROs.length,
    });
  } catch (error) {
    console.error("Error calculating warranty opportunity:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to calculate warranty opportunity",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Find the best contiguous window of N ROs using sliding window algorithm
 * Same logic as RO optimizer
 *
 * IMPORTANT: We calculate the KPI from aggregated totals, not by averaging per-RO KPIs.
 * This ensures we get the correct weighted average across all eligible operations.
 */
function findBestContiguousWindow(
  ros: any[],
  windowSize: number,
  searchMode: string
): any[] {
  if (ros.length === 0) {
    return [];
  }

  // If we have fewer ROs than the window size, return all
  if (ros.length <= windowSize) {
    return ros;
  }

  let bestWindow: any[] = [];
  let bestKPI = -Infinity;

  // Slide the window through all possible positions
  for (let i = 0; i <= ros.length - windowSize; i++) {
    const window = ros.slice(i, i + windowSize);

    // Calculate KPI from aggregated totals across the window
    // This gives us the correct weighted average, not an average of averages
    let windowKPI: number;

    if (searchMode === "labor") {
      // Sum eligible labor sale and hours across all ROs in window
      const totalEligibleLaborSale = window.reduce(
        (sum, ro) => sum + (ro.eligible_labor_sale || 0),
        0
      );
      const totalEligibleLaborHours = window.reduce(
        (sum, ro) => sum + (ro.eligible_labor_hours || 0),
        0
      );

      // Calculate ELR from totals
      windowKPI =
        totalEligibleLaborHours > 0
          ? totalEligibleLaborSale / totalEligibleLaborHours
          : 0;
    } else {
      // Sum eligible parts sale and cost across all ROs in window
      const totalEligiblePartsSale = window.reduce(
        (sum, ro) => sum + (ro.eligible_parts_sale || 0),
        0
      );
      const totalEligiblePartsCost = window.reduce(
        (sum, ro) => sum + (ro.eligible_parts_cost || 0),
        0
      );

      // Calculate Parts Markup % from totals
      windowKPI =
        totalEligiblePartsCost > 0
          ? ((totalEligiblePartsSale - totalEligiblePartsCost) /
              totalEligiblePartsCost) *
            100
          : 0;
    }

    if (windowKPI > bestKPI) {
      bestKPI = windowKPI;
      bestWindow = window;
    }
  }

  return bestWindow;
}
