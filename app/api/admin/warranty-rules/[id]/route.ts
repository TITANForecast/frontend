import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { WarrantyRuleInput, WarrantyRule } from "@/lib/types/admin";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/admin/warranty-rules/[id]
 * Retrieve a specific warranty rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;

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
      WHERE id = $1
    `;

    const result = await prisma.$queryRawUnsafe<WarrantyRule[]>(
      query,
      BigInt(id)
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Warranty rule not found" },
        { status: 404 }
      );
    }

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

    return jsonResponse(serializedRule);
  } catch (error) {
    console.error("Error fetching warranty rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch warranty rule" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/warranty-rules/[id]
 * Update a warranty rule
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body: Partial<WarrantyRuleInput> = await request.json();

    // Validate ruleType if provided
    if (
      body.ruleType &&
      !["maintenance", "exclusion", "positive"].includes(body.ruleType)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid ruleType. Must be: maintenance, exclusion, or positive",
        },
        { status: 400 }
      );
    }

    // Validate adjustment range if provided
    if (
      body.adjustment !== undefined &&
      (body.adjustment < -1 || body.adjustment > 1)
    ) {
      return NextResponse.json(
        { error: "Adjustment must be between -1 and 1" },
        { status: 400 }
      );
    }

    // Validate state if provided
    if (
      body.state !== undefined &&
      body.state !== null &&
      body.state.length !== 2
    ) {
      return NextResponse.json(
        { error: "State must be a 2-letter US state code" },
        { status: 400 }
      );
    }

    // Check if rule exists
    const checkQuery = `SELECT id FROM warranty_rules WHERE id = $1`;
    const existing = await prisma.$queryRawUnsafe<any[]>(
      checkQuery,
      BigInt(id)
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Warranty rule not found" },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (body.ruleType !== undefined) {
      updateFields.push(`rule_type = $${paramIndex++}`);
      updateValues.push(body.ruleType);
    }
    if (body.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(body.category);
    }
    if (body.keywordPattern !== undefined) {
      updateFields.push(`keyword_pattern = $${paramIndex++}`);
      updateValues.push(body.keywordPattern);
    }
    if (body.adjustment !== undefined) {
      updateFields.push(`adjustment = $${paramIndex++}`);
      updateValues.push(body.adjustment);
    }
    if (body.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(body.description);
    }
    if (body.notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(body.notes);
    }
    if (body.state !== undefined) {
      updateFields.push(`state = $${paramIndex++}`);
      updateValues.push(body.state);
    }
    if (body.oemMake !== undefined) {
      updateFields.push(`oem_make = $${paramIndex++}`);
      updateValues.push(body.oemMake);
    }
    if (body.isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(body.isActive);
    }
    if (body.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      updateValues.push(body.priority);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const userId = auth.user?.id || null;
    updateFields.push(`updated_by = $${paramIndex++}`);
    updateValues.push(userId);
    updateFields.push(`updated_at = NOW()`);

    updateValues.push(BigInt(id)); // For WHERE clause

    const updateQuery = `
      UPDATE warranty_rules
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
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
      updateQuery,
      ...updateValues
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

    return jsonResponse(serializedRule);
  } catch (error: any) {
    console.error("Error updating warranty rule:", error);
    return NextResponse.json(
      { error: "Failed to update warranty rule", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/warranty-rules/[id]
 * Delete a warranty rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;

    // Check if rule exists
    const checkQuery = `SELECT id FROM warranty_rules WHERE id = $1`;
    const existing = await prisma.$queryRawUnsafe<any[]>(
      checkQuery,
      BigInt(id)
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Warranty rule not found" },
        { status: 404 }
      );
    }

    const deleteQuery = `DELETE FROM warranty_rules WHERE id = $1`;
    await prisma.$executeRawUnsafe(deleteQuery, BigInt(id));

    return NextResponse.json({ message: "Warranty rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting warranty rule:", error);
    return NextResponse.json(
      { error: "Failed to delete warranty rule" },
      { status: 500 }
    );
  }
}
