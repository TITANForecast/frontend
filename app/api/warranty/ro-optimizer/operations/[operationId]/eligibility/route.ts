import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * PATCH /api/warranty/ro-optimizer/operations/[operationId]/eligibility
 * Update operation eligibility status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  try {
    const { operationId } = await params;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const body = await request.json();
    const { isEligible } = body;

    if (!dealerId) {
      return jsonResponse(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    if (typeof isEligible !== "boolean") {
      return jsonResponse(
        { error: "isEligible must be a boolean" },
        { status: 400 }
      );
    }

    const auth = await requireDealerAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Update operation eligibility
    // Note: Using raw query since operation table is managed by data-api
    // Escape dealerId to prevent SQL injection
    const escapedDealerId = dealerId.replace(/'/g, "''");
    
    // Handle operationId - could be numeric or UUID
    const operationIdParam = isNaN(Number(operationId))
      ? `'${operationId.replace(/'/g, "''")}'`
      : operationId;
    
    const updateQuery = `
      UPDATE operation
      SET is_warranty_eligible = ${isEligible},
          updated_at = NOW()
      WHERE id = ${operationIdParam}
        AND dealer_id = '${escapedDealerId}'
    `;

    await prisma.$executeRawUnsafe(updateQuery);

    // Verify the update was successful by fetching the operation
    const verifyQuery = `
      SELECT id, is_warranty_eligible
      FROM operation
      WHERE id = ${operationIdParam}
        AND dealer_id = '${escapedDealerId}'
    `;

    const result = await prisma.$queryRawUnsafe<any[]>(verifyQuery);

    if (!result || result.length === 0) {
      return jsonResponse(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    return jsonResponse({
      success: true,
      operation: result[0],
    });
  } catch (error) {
    console.error("Error updating operation eligibility:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      {
        error: "Failed to update operation eligibility",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

