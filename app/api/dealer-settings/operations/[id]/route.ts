import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * PATCH /api/dealer-settings/operations/[id]
 * Update operation service mapping and warranty eligibility
 * Note: Operations table is managed by data-api, so we use raw queries
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dealerId, serviceId, isWarrantyEligible, eligibilityNotes } = body;

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    const auth = await requireDealerWriteAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Verify operation exists and belongs to dealer
    const existingOperation = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM operation WHERE id = ${id} AND dealer_id = '${dealerId}'`
    );

    if (!existingOperation || existingOperation.length === 0) {
      return NextResponse.json(
        { error: "Operation not found" },
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
    const values: any[] = [];

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

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE operation 
      SET ${updates.join(", ")}
      WHERE id = ${id} AND dealer_id = '${dealerId}'
    `;

    await prisma.$executeRawUnsafe(updateQuery);

    // Fetch the updated operation with joins
    const updatedOperation = await prisma.$queryRawUnsafe<any[]>(`
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
      WHERE o.id = ${id} AND o.dealer_id = '${dealerId}'
    `);

    if (!updatedOperation || updatedOperation.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch updated operation" },
        { status: 500 }
      );
    }

    return jsonResponse(updatedOperation[0]);
  } catch (error) {
    console.error("Error updating operation:", error);
    return NextResponse.json(
      { error: "Failed to update operation" },
      { status: 500 }
    );
  }
}
