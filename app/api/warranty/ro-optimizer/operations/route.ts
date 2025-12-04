import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/warranty/ro-optimizer/operations
 * Fetch all operations for a specific RO (for expandable details)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const serviceRecordId = searchParams.get("serviceRecordId");

    if (!dealerId || !serviceRecordId) {
      return NextResponse.json(
        { error: "dealerId and serviceRecordId are required" },
        { status: 400 }
      );
    }

    const auth = await requireDealerAccess(request, dealerId);
    if (!auth.authorized) {
      return dealerUnauthorizedResponse(auth.error);
    }

    // Fetch all operations for this RO with detailed information
    const operationsQuery = `
      SELECT 
        o.id,
        o.operation_code,
        o.operation_description,
        o.labor_complaint,
        o.labor_cause,
        o.labor_correction,
        o.is_warranty_eligible,
        o.eligibility_notes,
        o.service_id,
        o.sale_type as pay_type,
        COALESCE(SUM(l.labor_bill_hours), 0) as labor_hours,
        COALESCE(SUM(l.labor_sale), 0) as labor_sale,
        COALESCE(SUM(p.parts_unit_sale * p.part_quantity), 0) as parts_sale,
        COALESCE(SUM(p.parts_unit_cost * p.part_quantity), 0) as parts_cost,
        wae.ai_eligible as warranty_evaluation_eligible,
        wae.ai_confidence as warranty_evaluation_confidence,
        wae.ai_reason as warranty_evaluation_reason,
        wae.ai_rule_applied as warranty_evaluation_rule_applied,
        wae.user_confirmed as warranty_evaluation_user_confirmed
      FROM operation o
      LEFT JOIN service_record sr ON o.service_record_id = sr.id
      LEFT JOIN labor_line l ON o.id = l.operation_id
      LEFT JOIN parts_line p ON o.id = p.operation_id
      LEFT JOIN LATERAL (
        SELECT *
        FROM warranty_ai_evaluation wae_inner
        WHERE wae_inner.operation_id = o.id
        ORDER BY wae_inner.evaluated_at DESC
        LIMIT 1
      ) wae ON true
      WHERE o.service_record_id = '${serviceRecordId}'
        AND o.dealer_id = '${dealerId}'
      GROUP BY o.id, o.operation_code, o.operation_description, o.labor_complaint, 
               o.labor_cause, o.labor_correction, o.is_warranty_eligible, o.eligibility_notes, 
               o.service_id, o.sale_type,
               wae.ai_eligible, wae.ai_confidence, wae.ai_reason, wae.ai_rule_applied, wae.user_confirmed
      ORDER BY o.operation_code
    `;

    const operations = await prisma.$queryRawUnsafe<any[]>(operationsQuery);

    // Calculate operation-level KPIs
    const operationsWithKPIs = operations.map((op: any) => {
      const laborHours = parseFloat(op.labor_hours || 0);
      const laborSale = parseFloat(op.labor_sale || 0);
      const partsSale = parseFloat(op.parts_sale || 0);
      const partsCost = parseFloat(op.parts_cost || 0);

      // Calculate operation-level ELR
      const operationELR = laborHours > 0 ? laborSale / laborHours : 0;

      // Calculate Parts Markup %
      const partsMarkupPercent =
        partsCost > 0 ? ((partsSale - partsCost) / partsCost) * 100 : 0;

      return {
        ...op,
        operation_elr: operationELR,
        parts_markup_percent: partsMarkupPercent,
      };
    });

    return jsonResponse({
      data: operationsWithKPIs,
    });
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { error: "Failed to fetch operations" },
      { status: 500 }
    );
  }
}
