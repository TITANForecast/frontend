import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/operations/[id]/parts/[partNumber]
 * Retrieve part details for a specific part number in an operation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partNumber: string }> }
) {
  try {
    const { id, partNumber } = await params;
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

    // Decode the part number (URL encoded)
    const decodedPartNumber = decodeURIComponent(partNumber);

    // Escape single quotes in part number to prevent SQL injection
    const escapedPartNumber = decodedPartNumber.replace(/'/g, "''");

    // Query parts_line table to get part details
    const query = `
      SELECT 
        p.id,
        p.part_number,
        p.part_description,
        p.part_quantity as quantity,
        p.parts_unit_cost as unit_cost,
        COALESCE(p.parts_unit_sale, p.parts_unit_cost) as unit_sale,
        p.parts_unit_cost * p.part_quantity as total_cost,
        COALESCE(p.parts_unit_sale, p.parts_unit_cost) * p.part_quantity as total_sale,
        o.operation_code,
        o.operation_description,
        sr.ro_number
      FROM parts_line p
      INNER JOIN operation o ON p.operation_id = o.id
      INNER JOIN service_record sr ON o.service_record_id = sr.id
      WHERE p.operation_id = '${id}'
        AND p.part_number = '${escapedPartNumber}'
        AND o.dealer_id = '${dealerId}'
      ORDER BY p.id
    `;

    const parts = await prisma.$queryRawUnsafe<any[]>(query);

    if (!parts || parts.length === 0) {
      return NextResponse.json(
        { error: "Part not found" },
        { status: 404 }
      );
    }

    return jsonResponse({
      partNumber: decodedPartNumber,
      parts: parts,
      summary: {
        totalQuantity: parts.reduce((sum, p) => {
          const qty = p.quantity ? parseFloat(p.quantity) : 0;
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0),
        totalCost: parts.reduce((sum, p) => {
          const cost = p.total_cost ? parseFloat(p.total_cost) : 0;
          return sum + (isNaN(cost) ? 0 : cost);
        }, 0),
        totalSale: parts.reduce((sum, p) => {
          const sale = p.total_sale ? parseFloat(p.total_sale) : 0;
          return sum + (isNaN(sale) ? 0 : sale);
        }, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching part details:", error);
    return NextResponse.json(
      { error: "Failed to fetch part details" },
      { status: 500 }
    );
  }
}

