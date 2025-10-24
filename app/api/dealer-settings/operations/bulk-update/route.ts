import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";

/**
 * POST /api/dealer-settings/operations/bulk-update
 * Bulk update multiple operations with service mapping and warranty eligibility
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dealerId,
      operationIds,
      serviceId,
      isWarrantyEligible,
      eligibilityNotes,
    } = body;

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    if (
      !operationIds ||
      !Array.isArray(operationIds) ||
      operationIds.length === 0
    ) {
      return NextResponse.json(
        { error: "operationIds array is required" },
        { status: 400 }
      );
    }

    const auth = await requireDealerWriteAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Verify all operations exist and belong to dealer
    const operationIdsStr = operationIds.join(",");
    const existingOperations = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM operation WHERE id IN (${operationIdsStr}) AND dealer_id = '${dealerId}'`
    );

    if (existingOperations.length !== operationIds.length) {
      return NextResponse.json(
        {
          error:
            "Some operations were not found or do not belong to this dealer",
        },
        { status: 404 }
      );
    }

    // If serviceId is provided, verify it belongs to the dealer
    if (serviceId !== undefined && serviceId !== null) {
      const service = await prisma.service.findFirst({
        where: {
          id: BigInt(serviceId),
          dealerId,
        },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service not found or does not belong to this dealer" },
          { status: 404 }
        );
      }
    }

    // Build update query
    const updates: string[] = [];

    if (serviceId !== undefined) {
      updates.push(
        serviceId === null ? "service_id = NULL" : `service_id = ${serviceId}`
      );
    }

    if (isWarrantyEligible !== undefined) {
      if (isWarrantyEligible === null) {
        updates.push("is_warranty_eligible = NULL");
      } else {
        updates.push(`is_warranty_eligible = ${isWarrantyEligible}`);
      }
    }

    if (eligibilityNotes !== undefined) {
      if (eligibilityNotes === null) {
        updates.push("eligibility_notes = NULL");
      } else {
        // Escape single quotes in the notes
        const escapedNotes = eligibilityNotes.replace(/'/g, "''");
        updates.push(`eligibility_notes = '${escapedNotes}'`);
      }
    }

    // Always update updated_at
    // Note: updated_by is bigint but user.id is text (UUID), type mismatch
    // This should be addressed in the data-api by changing updated_by to text
    // updates.push(`updated_by = '${auth.user.id}'`);
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE operation 
      SET ${updates.join(", ")}
      WHERE id IN (${operationIdsStr}) AND dealer_id = '${dealerId}'
    `;

    await prisma.$executeRawUnsafe(updateQuery);

    return NextResponse.json({
      message: "Operations updated successfully",
      updatedCount: operationIds.length,
      operationIds: operationIds,
    });
  } catch (error) {
    console.error("Error bulk updating operations:", error);
    return NextResponse.json(
      { error: "Failed to bulk update operations" },
      { status: 500 }
    );
  }
}
