import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/warranty/ro-optimizer
 * Fetch eligible ROs and calculate the best contiguous set of N ROs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const eligibleOnly = searchParams.get("eligibleOnly") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const windowSize = parseInt(searchParams.get("windowSize") || "100");
    const minMileage = searchParams.get("minMileage");
    const maxMileage = searchParams.get("maxMileage");
    const minYear = searchParams.get("minYear");
    const maxYear = searchParams.get("maxYear");
    const years = searchParams.get("years"); // Comma-separated years
    const searchMode = searchParams.get("searchMode") || "labor"; // "labor" or "parts"

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

    // Build WHERE clause for RO filtering
    // Escape dealerId to prevent SQL injection
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

    if (minMileage && minMileage.trim() !== "") {
      const mileageValue = parseFloat(minMileage);
      if (!isNaN(mileageValue) && isFinite(mileageValue)) {
        whereConditions.push(`sr.ro_mileage >= ${mileageValue}`);
      }
    }

    if (maxMileage && maxMileage.trim() !== "") {
      const mileageValue = parseFloat(maxMileage);
      if (!isNaN(mileageValue) && isFinite(mileageValue)) {
        whereConditions.push(`sr.ro_mileage <= ${mileageValue}`);
      }
    }

    if (years && years.trim() !== "") {
      const yearArray = years
        .split(",")
        .map((y) => {
          const trimmed = y.trim();
          if (trimmed === "") return null;
          const escaped = trimmed.replace(/'/g, "''");
          return `'${escaped}'`;
        })
        .filter((y) => y !== null);
      if (yearArray.length > 0) {
        whereConditions.push(
          `NULLIF(v.year, '') IS NOT NULL AND v.year IN (${yearArray.join(
            ","
          )})`
        );
      }
    } else {
      if (minYear && minYear.trim() !== "") {
        const yearValue = parseInt(minYear, 10);
        if (!isNaN(yearValue) && isFinite(yearValue)) {
          whereConditions.push(
            `NULLIF(v.year, '') IS NOT NULL AND CAST(NULLIF(v.year, '') AS INTEGER) >= ${yearValue}`
          );
        }
      }
      if (maxYear && maxYear.trim() !== "") {
        const yearValue = parseInt(maxYear, 10);
        if (!isNaN(yearValue) && isFinite(yearValue)) {
          whereConditions.push(
            `NULLIF(v.year, '') IS NOT NULL AND CAST(NULLIF(v.year, '') AS INTEGER) <= ${yearValue}`
          );
        }
      }
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Query to get ROs with aggregated operation data
    // For each RO, we need:
    // - Total labor sale, labor hours (for RO-level ELR calculation)
    // - Total parts sale, parts cost (for RO-level Parts Markup % calculation)
    // - Eligible operations KPIs: average ELR or average Parts Markup % of eligible operations only
    // - Count of eligible operations
    const roQuery = `
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
        -- Eligible operations totals and KPIs (only eligible operations)
        ${
          searchMode === "labor"
            ? `
        -- For labor mode: totals and average ELR of eligible operations
        SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_sale ELSE 0 END) as eligible_labor_sale,
        SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) as eligible_labor_hours,
        CASE 
          WHEN SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) > 0
          THEN SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_sale ELSE 0 END) / 
               SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END)
          ELSE 0
        END as eligible_avg_elr,
        COUNT(DISTINCT CASE WHEN o.is_warranty_eligible = true AND (COALESCE(l.labor_sale, 0) > 0 OR COALESCE(l.labor_bill_hours, 0) > 0) THEN o.id END) as eligible_operations_count
            `
            : `
        -- For parts mode: totals and average Parts Markup % of eligible operations
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
            `
        }
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
          '${
            searchMode === "labor" ? "labor" : "parts"
          }' = 'labor' AND (COALESCE(SUM(l.labor_sale), 0) > 0 OR COALESCE(SUM(l.labor_bill_hours), 0) > 0)
          OR
          '${
            searchMode === "labor" ? "labor" : "parts"
          }' = 'parts' AND COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) > 0
        )
        -- Must have at least one eligible operation
        AND (
          ${
            searchMode === "labor"
              ? `SUM(CASE WHEN o.is_warranty_eligible = true THEN l.labor_bill_hours ELSE 0 END) > 0`
              : `SUM(CASE WHEN o.is_warranty_eligible = true THEN p.parts_unit_cost * p.part_quantity ELSE 0 END) > 0`
          }
        )
        ${
          eligibleOnly
            ? searchMode === "labor"
              ? `AND BOOL_OR(o.is_warranty_eligible = true AND (COALESCE(l.labor_sale, 0) > 0 OR COALESCE(l.labor_bill_hours, 0) > 0))`
              : `AND BOOL_OR(o.is_warranty_eligible = true AND COALESCE(p.parts_unit_sale * p.part_quantity, 0) > 0)`
            : ""
        }
      ORDER BY sr.open_date ASC
    `;

    // Debug: Log the query (remove in production if sensitive)
    console.log("RO Optimizer Query:", roQuery.substring(0, 500) + "...");

    const ros = await prisma.$queryRawUnsafe<any[]>(roQuery);

    // Calculate RO-level KPIs and eligible operations KPIs
    const rosWithKPIs = ros.map((ro: any) => {
      const totalLaborSale = parseFloat(String(ro.total_labor_sale || 0));
      const totalLaborHours = parseFloat(String(ro.total_labor_hours || 0));
      const totalPartsSale = parseFloat(String(ro.total_parts_sale || 0));
      const totalPartsCost = parseFloat(String(ro.total_parts_cost || 0));

      // Calculate RO-level ELR (for display purposes)
      const elr = totalLaborHours > 0 ? totalLaborSale / totalLaborHours : 0;

      // Calculate RO-level Parts Markup % (for display purposes)
      const partsMarkupPercent =
        totalPartsCost > 0
          ? ((totalPartsSale - totalPartsCost) / totalPartsCost) * 100
          : 0;

      // Get eligible operations KPI and totals (this is what we use for best set selection)
      const eligibleOperationsCount = parseInt(
        String(ro.eligible_operations_count || 0)
      );
      const eligibleKPI =
        searchMode === "labor"
          ? parseFloat(String(ro.eligible_avg_elr || 0))
          : parseFloat(String(ro.eligible_avg_parts_markup || 0));

      // Get eligible operations totals for accurate overall average calculation
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
        service_record_id: String(ro.service_record_id),
        ro_number: ro.ro_number,
        ro_open_date: ro.ro_open_date
          ? new Date(ro.ro_open_date).toISOString()
          : null,
        vehicle_year: ro.vehicle_year ? String(ro.vehicle_year) : null,
        vehicle_make: ro.vehicle_make,
        vehicle_model: ro.vehicle_model,
        vehicle_mileage: ro.vehicle_mileage
          ? parseFloat(String(ro.vehicle_mileage))
          : null,
        total_labor_sale: totalLaborSale,
        total_labor_hours: totalLaborHours,
        total_parts_sale: totalPartsSale,
        total_parts_cost: totalPartsCost,
        ro_level_elr: elr,
        ro_level_parts_markup_percent: partsMarkupPercent,
        // Eligible operations KPI (used for best set selection)
        eligible_operations_kpi: eligibleKPI,
        eligible_operations_count: eligibleOperationsCount,
        // Eligible operations totals (for accurate overall average calculation)
        eligible_labor_sale: eligibleLaborSale,
        eligible_labor_hours: eligibleLaborHours,
        eligible_parts_sale: eligiblePartsSale,
        eligible_parts_cost: eligiblePartsCost,
      };
    });

    // Apply sliding window optimization
    const bestSet = findBestContiguousWindow(
      rosWithKPIs,
      windowSize,
      searchMode
    );

    // Calculate warranty revenue metrics (only for labor mode)
    let warrantyRevenueMetrics = null;
    if (searchMode === "labor") {
      // Calculate past 12 months warranty labor revenue and hours
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split("T")[0];

      const escapedDealerId = dealerId.replace(/'/g, "''");
      // Match the export query logic exactly: group by operation first, then sum
      // This ensures each operation is counted once with its labor_line records properly aggregated
      // Using same table structure and joins as export: FROM operation o, LEFT JOIN service_record sr
      const warrantyRevenueQuery = `
        SELECT 
          COALESCE(SUM(operation_totals.total_labor_sale), 0) as past_year_warranty_labor_revenue,
          COALESCE(SUM(operation_totals.total_labor_hours), 0) as past_year_warranty_hours
        FROM (
          SELECT 
            o.id,
            COALESCE(SUM(l.labor_sale), 0) as total_labor_sale,
            COALESCE(SUM(l.labor_bill_hours), 0) as total_labor_hours
          FROM operation o
          LEFT JOIN service_record sr ON o.service_record_id = sr.id
          LEFT JOIN labor_line l ON o.id = l.operation_id
          WHERE o.dealer_id = '${escapedDealerId}'
            AND sr.open_date >= '${twelveMonthsAgoStr}'
            AND o.sale_type = 'W'
          GROUP BY o.id
          HAVING COALESCE(SUM(l.labor_sale), 0) > 0
        ) operation_totals
      `;

      const warrantyRevenueResult = await prisma.$queryRawUnsafe<any[]>(
        warrantyRevenueQuery
      );

      const pastYearWarrantyLaborRevenue = warrantyRevenueResult[0]
        ?.past_year_warranty_labor_revenue
        ? parseFloat(
            String(warrantyRevenueResult[0].past_year_warranty_labor_revenue)
          )
        : 0;
      const pastYearWarrantyHours = warrantyRevenueResult[0]
        ?.past_year_warranty_hours
        ? parseFloat(String(warrantyRevenueResult[0].past_year_warranty_hours))
        : 0;

      // Get current warranty labor rate from dealer settings
      const generalSettings = await prisma.dealerGeneralSettings.findUnique({
        where: { dealerId },
      });
      const currentWarrantyLaborRate = generalSettings?.currentWarrantyLaborRate
        ? parseFloat(String(generalSettings.currentWarrantyLaborRate))
        : null;

      // Calculate average ELR from best set
      let newAverageELR = 0;
      if (bestSet.length > 0) {
        const totalEligibleLaborSale = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_labor_sale || 0),
          0
        );
        const totalEligibleLaborHours = bestSet.reduce(
          (sum, ro) => sum + (ro.eligible_labor_hours || 0),
          0
        );
        if (totalEligibleLaborHours > 0) {
          newAverageELR = totalEligibleLaborSale / totalEligibleLaborHours;
        }
      }

      // Calculate potential warranty labor revenue
      // Formula: (New Average ELR rate - current) * Number of paid warranty hours for past 12 months
      let potentialWarrantyLaborRevenue = 0;
      if (currentWarrantyLaborRate !== null && newAverageELR > 0) {
        const rateDifference = newAverageELR - currentWarrantyLaborRate;
        potentialWarrantyLaborRevenue = rateDifference * pastYearWarrantyHours;
      }

      // Calculate additional revenue potential
      // Formula: Potential Warranty Labor Revenue - Past Year Warranty Labor Revenue
      const additionalRevenuePotential =
        potentialWarrantyLaborRevenue - pastYearWarrantyLaborRevenue;

      warrantyRevenueMetrics = {
        pastYearWarrantyLaborRevenue,
        potentialWarrantyLaborRevenue,
        additionalRevenuePotential,
        pastYearWarrantyHours,
        currentWarrantyLaborRate,
        newAverageELR,
      };
    }

    return jsonResponse({
      data: bestSet,
      totalCandidates: rosWithKPIs.length,
      windowSize: windowSize,
      warrantyRevenueMetrics,
    });
  } catch (error) {
    console.error("Error in RO optimizer:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      {
        error: "Failed to fetch and optimize ROs",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Find the best contiguous window of N ROs using sliding window algorithm
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

  console.log(
    `Optimization complete: Evaluated ${
      ros.length - windowSize + 1
    } windows, best KPI: ${bestKPI.toFixed(2)}`
  );

  return bestWindow;
}
