import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/opcodes
 * List opcodes for a dealer with warranty eligibility status and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = (page - 1) * limit;
    const sortColumn = searchParams.get("sortColumn") || "code";
    const sortDirection = searchParams.get("sortDirection") || "asc";

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

    // Map frontend column names to SQL columns
    const columnMap: Record<string, string> = {
      code: "o.operation_code",
      usage_count: "usage_count",
      is_warranty_eligible: "is_warranty_eligible",
    };

    const validColumn = columnMap[sortColumn] || "o.operation_code";
    const validDirection =
      sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Query distinct opcodes for this dealer with pagination
    const query = `
      SELECT 
        o.operation_code as code,
        COALESCE(oc.warranty_eligible, false) as is_warranty_eligible,
        oc.id as opcode_id,
        COUNT(DISTINCT o.id) as usage_count
      FROM operation o
      LEFT JOIN opcodes oc ON o.operation_code = oc.opcode
      WHERE o.dealer_id = $1
        AND o.operation_code IS NOT NULL
        AND o.operation_code != ''
      GROUP BY o.operation_code, oc.warranty_eligible, oc.id
      ORDER BY ${validColumn} ${validDirection}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count query for total
    const countQuery = `
      SELECT COUNT(DISTINCT o.operation_code) as total
      FROM operation o
      WHERE o.dealer_id = $1
        AND o.operation_code IS NOT NULL
        AND o.operation_code != ''
    `;

    const [opcodes, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(query, dealerId),
      prisma.$queryRawUnsafe<any[]>(countQuery, dealerId),
    ]);

    const total = Number(countResult[0]?.total || 0);

    return jsonResponse({
      data: opcodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching opcodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch opcodes" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dealer-settings/opcodes/:code/operations
 * Get last 10 operations for a specific opcode
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    // Get last 10 operations with this opcode
    const query = `
      SELECT 
        o.id,
        o.operation_code,
        o.operation_description,
        sr.open_date,
        sr.ro_number,
        o.labor_complaint,
        o.labor_cause,
        o.labor_correction,
        o.labor_comments
      FROM operation o
      LEFT JOIN service_record sr ON o.service_record_id = sr.id
      WHERE o.dealer_id = $1
        AND o.operation_code = $2
      ORDER BY sr.open_date DESC
      LIMIT 10
    `;

    const operations = await prisma.$queryRawUnsafe<any[]>(
      query,
      dealerId,
      code
    );

    return jsonResponse(operations);
  } catch (error) {
    console.error("Error fetching opcode operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer-settings/opcodes
 * Update warranty eligibility for opcodes
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { opcodes } = body; // Array of { code: string, is_warranty_eligible: boolean }

    if (!opcodes || !Array.isArray(opcodes)) {
      return NextResponse.json(
        { error: "opcodes array is required" },
        { status: 400 }
      );
    }

    // Update or insert opcode records (opcodes table is global, no dealer_id)
    for (const opcode of opcodes) {
      const { code, is_warranty_eligible } = opcode;

      // Check if opcode exists
      const existingOpcode = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM opcodes WHERE opcode = $1 LIMIT 1`,
        code
      );

      if (existingOpcode.length > 0) {
        // Update existing
        await prisma.$executeRawUnsafe(
          `UPDATE opcodes SET warranty_eligible = $1, updated_at = NOW() WHERE id = $2`,
          is_warranty_eligible,
          existingOpcode[0].id
        );
      } else {
        // Insert new
        await prisma.$executeRawUnsafe(
          `INSERT INTO opcodes (opcode, warranty_eligible, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW())`,
          code,
          is_warranty_eligible
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating opcodes:", error);
    return NextResponse.json(
      { error: "Failed to update opcodes" },
      { status: 500 }
    );
  }
}
