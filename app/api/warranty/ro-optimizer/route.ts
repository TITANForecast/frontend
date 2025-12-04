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
    // - Total labor sale, labor hours (for ELR calculation)
    // - Total parts sale, parts cost (for Parts Markup % calculation)
    // - Whether it has eligible operations of the selected type
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
        COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as total_parts_cost
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

    // Calculate RO-level KPIs
    const rosWithKPIs = ros.map((ro: any) => {
      const totalLaborSale = parseFloat(String(ro.total_labor_sale || 0));
      const totalLaborHours = parseFloat(String(ro.total_labor_hours || 0));
      const totalPartsSale = parseFloat(String(ro.total_parts_sale || 0));
      const totalPartsCost = parseFloat(String(ro.total_parts_cost || 0));

      // Calculate ELR (Effective Labor Rate)
      const elr = totalLaborHours > 0 ? totalLaborSale / totalLaborHours : 0;

      // Calculate Parts Markup %
      const partsMarkupPercent =
        totalPartsCost > 0
          ? ((totalPartsSale - totalPartsCost) / totalPartsCost) * 100
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
      };
    });

    // Apply sliding window optimization
    const bestSet = findBestContiguousWindow(
      rosWithKPIs,
      windowSize,
      searchMode
    );

    return jsonResponse({
      data: bestSet,
      totalCandidates: rosWithKPIs.length,
      windowSize: windowSize,
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
  let bestAverage = -Infinity;

  // Calculate KPI for each RO based on search mode
  const kpiKey =
    searchMode === "labor" ? "ro_level_elr" : "ro_level_parts_markup_percent";

  // Slide the window through all possible positions
  for (let i = 0; i <= ros.length - windowSize; i++) {
    const window = ros.slice(i, i + windowSize);
    const average =
      window.reduce((sum, ro) => sum + (ro[kpiKey] || 0), 0) / windowSize;

    if (average > bestAverage) {
      bestAverage = average;
      bestWindow = window;
    }
  }

  return bestWindow;
}
