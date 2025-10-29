import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/operations
 * List all operations for a dealer with service mappings and filters
 * Note: Operations table is managed by data-api, so we use raw queries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const serviceIds = searchParams.get("serviceIds"); // Comma-separated
    const warrantyEligible = searchParams.get("warrantyEligible"); // 'true', 'false', 'null'
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const payTypes = searchParams.get("payTypes"); // Comma-separated: C, W, I
    const eligibleMakesOnly = searchParams.get("eligibleMakesOnly"); // 'true'
    const eligibleOpcodesOnly = searchParams.get("eligibleOpcodesOnly"); // 'true'
    const hasLaborOrPartsOnly = searchParams.get("hasLaborOrPartsOnly"); // 'true'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const sortColumn = searchParams.get("sortColumn") || "service_record_open_date";
    const sortDirection = searchParams.get("sortDirection") || "desc";

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
    let whereConditions = [`o.dealer_id = '${dealerId}'`];

    if (serviceIds) {
      const serviceIdArray = serviceIds.split(",").map((id) => id.trim());
      if (serviceIdArray.includes("null")) {
        // Include null values
        const nonNullIds = serviceIdArray.filter((id) => id !== "null");
        if (nonNullIds.length > 0) {
          whereConditions.push(
            `(o.service_id IN (${nonNullIds.join(
              ","
            )}) OR o.service_id IS NULL)`
          );
        } else {
          whereConditions.push(`o.service_id IS NULL`);
        }
      } else {
        whereConditions.push(`o.service_id IN (${serviceIdArray.join(",")})`);
      }
    }

    if (warrantyEligible === "true") {
      whereConditions.push(`o.is_warranty_eligible = true`);
    } else if (warrantyEligible === "false") {
      whereConditions.push(`o.is_warranty_eligible = false`);
    } else if (warrantyEligible === "null") {
      whereConditions.push(`o.is_warranty_eligible IS NULL`);
    }

    if (startDate) {
      whereConditions.push(`sr.open_date >= '${startDate}'`);
    }

    if (endDate) {
      whereConditions.push(`sr.open_date <= '${endDate}'`);
    }

    if (payTypes) {
      const payTypeArray = payTypes.split(",").map((pt) => `'${pt.trim()}'`);
      whereConditions.push(`o.sale_type IN (${payTypeArray.join(",")})`);
    }

    if (eligibleMakesOnly === "true") {
      whereConditions.push(`m.warranty_eligible = true`);
    }

    if (eligibleOpcodesOnly === "true") {
      whereConditions.push(`oc.warranty_eligible = true`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Map frontend column names to SQL columns/aliases
    const columnMap: Record<string, string> = {
      service_record_open_date: "sr.open_date",
      operation_code: "o.operation_code",
      operation_description: "o.operation_description",
      pay_type: "o.sale_type",
      service_name: "s.name",
      service_category_name: "sc.name",
      service_subcategory_name: "ss.name",
      is_warranty_eligible: "o.is_warranty_eligible",
      ai_confidence_warranty: "o.ai_confidence_warranty",
    };

    // Sanitize sort parameters
    const validColumn = columnMap[sortColumn] || "sr.open_date";
    const validDirection = sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";
    const orderByClause = `ORDER BY ${validColumn} ${validDirection}, o.id DESC`;

    // HAVING clause for labor/parts filter
    const havingClause = hasLaborOrPartsOnly === "true"
      ? `HAVING (SUM(l.labor_tech_hours) > 0 OR SUM(l.labor_cost) > 0 OR SUM(p.parts_unit_cost * p.part_quantity) > 0)`
      : "";

    // Query operations with joins to service_record, services, labor and parts
    const query = `
      SELECT 
        o.*,
        sr.open_date as service_record_open_date,
        sr.ro_number as ro_number,
        s.id as service_id,
        s.name as service_name,
        sc.id as service_category_id,
        sc.name as service_category_name,
        ss.id as service_subcategory_id,
        ss.name as service_subcategory_name,
        u.name as updated_by_user_name,
        v.make as vehicle_make,
        o.sale_type as pay_type,
        COALESCE(SUM(l.labor_tech_hours), 0) as total_labor_hours,
        COALESCE(SUM(l.labor_cost), 0) as total_labor_cost,
        COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as total_parts_cost,
        COUNT(DISTINCT CASE WHEN p.part_number IS NOT NULL AND p.part_number != '' THEN p.id END) as parts_count,
        STRING_AGG(DISTINCT NULLIF(p.part_number, ''), ', ') FILTER (WHERE p.part_number IS NOT NULL AND p.part_number != '') as parts_list
      FROM operation o
      LEFT JOIN service_record sr ON o.service_record_id = sr.id
      LEFT JOIN vehicle v ON sr.vehicle_id = v.id
      LEFT JOIN makes m ON v.make = m.make_name
      LEFT JOIN opcodes oc ON o.operation_code = oc.opcode
      LEFT JOIN services s ON o.service_id = s.id AND o.dealer_id = s.dealer_id
      LEFT JOIN service_categories sc ON s.category_id = sc.id AND s.dealer_id = sc.dealer_id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id AND s.dealer_id = ss.dealer_id
      LEFT JOIN users u ON o.updated_by::text = u.id
      LEFT JOIN labor_line l ON o.id = l.operation_id
      LEFT JOIN parts_line p ON o.id = p.operation_id
      ${whereClause}
      GROUP BY o.id, sr.open_date, sr.ro_number, s.id, s.name, sc.id, sc.name, ss.id, ss.name, u.name, v.make
      ${havingClause}
      ${orderByClause}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count query - need to account for HAVING clause if used
    const countQuery = hasLaborOrPartsOnly === "true"
      ? `
        SELECT COUNT(*) as total
        FROM (
          SELECT o.id
          FROM operation o
          LEFT JOIN service_record sr ON o.service_record_id = sr.id
          LEFT JOIN vehicle v ON sr.vehicle_id = v.id
          LEFT JOIN makes m ON v.make = m.make_name
          LEFT JOIN opcodes oc ON o.operation_code = oc.opcode
          LEFT JOIN labor_line l ON o.id = l.operation_id
          LEFT JOIN parts_line p ON o.id = p.operation_id
          ${whereClause}
          GROUP BY o.id
          ${havingClause}
        ) as filtered_ops
      `
      : `
        SELECT COUNT(*) as total
        FROM operation o
        LEFT JOIN service_record sr ON o.service_record_id = sr.id
        LEFT JOIN vehicle v ON sr.vehicle_id = v.id
        LEFT JOIN makes m ON v.make = m.make_name
        LEFT JOIN opcodes oc ON o.operation_code = oc.opcode
        ${whereClause}
      `;

    const [operations, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(query),
      prisma.$queryRawUnsafe<any[]>(countQuery),
    ]);

    const total = Number(countResult[0]?.total || 0);

    return jsonResponse({
      data: operations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}
