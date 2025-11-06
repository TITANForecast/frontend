import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { WarrantyRuleInput, WarrantyRule } from "@/lib/types/admin";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/admin/warranty-rules
 * Retrieve warranty rules with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = (page - 1) * limit;
    const sortColumn = searchParams.get("sortColumn") || "priority";
    const sortDirection = searchParams.get("sortDirection") || "asc";

    // Map frontend column names to SQL columns
    const columnMap: Record<string, string> = {
      ruleType: "rule_type",
      category: "category",
      keywordPattern: "keyword_pattern",
      description: "description",
      adjustment: "adjustment",
      priority: "priority",
      isActive: "is_active",
      createdAt: "created_at",
      updatedAt: "updated_at",
    };

    const validColumn = columnMap[sortColumn] || "priority";
    const validDirection =
      sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";

    const query = `
      SELECT 
        id,
        rule_type as "ruleType",
        category,
        keyword_pattern as "keywordPattern",
        adjustment,
        description,
        notes,
        state,
        oem_make as "oemMake",
        is_active as "isActive",
        priority,
        created_by as "createdBy",
        updated_by as "updatedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM warranty_rules
      ORDER BY ${validColumn} ${validDirection}, priority ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM warranty_rules`;

    const [rules, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<WarrantyRule[]>(query),
      prisma.$queryRawUnsafe<any[]>(countQuery),
    ]);

    const total = Number(countResult[0]?.total || 0);

    // Convert BigInt fields to strings and ensure numeric fields are numbers
    const serializedRules = rules.map((rule: any) => ({
      ...rule,
      id: rule.id.toString(),
      adjustment:
        typeof rule.adjustment === "number"
          ? rule.adjustment
          : parseFloat(String(rule.adjustment)) || 0,
      createdBy: rule.createdBy ? rule.createdBy.toString() : null,
      updatedBy: rule.updatedBy ? rule.updatedBy.toString() : null,
    }));

    return jsonResponse({
      data: serializedRules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching warranty rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch warranty rules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/warranty-rules
 * Create a new warranty rule
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body: WarrantyRuleInput = await request.json();

    // Validation
    if (
      !body.ruleType ||
      !body.category ||
      !body.keywordPattern ||
      body.adjustment === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: ruleType, category, keywordPattern, adjustment",
        },
        { status: 400 }
      );
    }

    // Validate ruleType
    if (!["maintenance", "exclusion", "positive"].includes(body.ruleType)) {
      return NextResponse.json(
        {
          error:
            "Invalid ruleType. Must be: maintenance, exclusion, or positive",
        },
        { status: 400 }
      );
    }

    // Validate adjustment range
    if (body.adjustment < -1 || body.adjustment > 1) {
      return NextResponse.json(
        { error: "Adjustment must be between -1 and 1" },
        { status: 400 }
      );
    }

    // Validate state if provided (2-letter code)
    if (body.state && body.state.length !== 2) {
      return NextResponse.json(
        { error: "State must be a 2-letter US state code" },
        { status: 400 }
      );
    }

    const userId = auth.user?.id || null;

    const insertQuery = `
      INSERT INTO warranty_rules (
        rule_type,
        category,
        keyword_pattern,
        adjustment,
        description,
        notes,
        state,
        oem_make,
        is_active,
        priority,
        created_by,
        updated_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING 
        id,
        rule_type as "ruleType",
        category,
        keyword_pattern as "keywordPattern",
        adjustment,
        description,
        notes,
        state,
        oem_make as "oemMake",
        is_active as "isActive",
        priority,
        created_by as "createdBy",
        updated_by as "updatedBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await prisma.$queryRawUnsafe<WarrantyRule[]>(
      insertQuery,
      body.ruleType,
      body.category,
      body.keywordPattern,
      body.adjustment,
      body.description || null,
      body.notes || null,
      body.state || null,
      body.oemMake || null,
      body.isActive !== undefined ? body.isActive : true,
      body.priority !== undefined ? body.priority : 100,
      userId,
      userId
    );

    const rule = result[0];
    const serializedRule = {
      ...rule,
      id: rule.id.toString(),
      adjustment:
        typeof rule.adjustment === "number"
          ? rule.adjustment
          : parseFloat(String(rule.adjustment)) || 0,
      createdBy: rule.createdBy ? rule.createdBy.toString() : null,
      updatedBy: rule.updatedBy ? rule.updatedBy.toString() : null,
    };

    return jsonResponse(serializedRule, { status: 201 });
  } catch (error: any) {
    console.error("Error creating warranty rule:", error);
    return NextResponse.json(
      { error: "Failed to create warranty rule", details: error.message },
      { status: 500 }
    );
  }
}
