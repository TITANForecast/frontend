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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

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

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Query operations with joins to service_record and services
    const query = `
      SELECT 
        o.*,
        sr.open_date as service_record_open_date,
        s.id as service_id,
        s.name as service_name,
        sc.id as service_category_id,
        sc.name as service_category_name,
        ss.id as service_subcategory_id,
        ss.name as service_subcategory_name,
        u.name as updated_by_user_name
      FROM operation o
      LEFT JOIN service_record sr ON o.service_record_id = sr.id AND o.dealer_id = sr.dealer_id
      LEFT JOIN services s ON o.service_id = s.id AND o.dealer_id = s.dealer_id
      LEFT JOIN service_categories sc ON s.category_id = sc.id AND s.dealer_id = sc.dealer_id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id AND s.dealer_id = ss.dealer_id
      LEFT JOIN users u ON o.updated_by::text = u.id
      ${whereClause}
      ORDER BY sr.open_date DESC, o.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM operation o
      LEFT JOIN service_record sr ON o.service_record_id = sr.id AND o.dealer_id = sr.dealer_id
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
