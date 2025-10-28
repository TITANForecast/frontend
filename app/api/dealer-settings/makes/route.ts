import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/makes
 * List all makes for a dealer with warranty eligibility status
 */
export async function GET(request: NextRequest) {
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

    // Query all distinct makes from service records for this dealer
    const query = `
      SELECT 
        v.make as name,
        COALESCE(m.warranty_eligible, false) as is_warranty_eligible,
        m.id as make_id,
        COUNT(DISTINCT sr.id) as record_count
      FROM service_record sr
      LEFT JOIN vehicle v ON sr.vehicle_id = v.id
      LEFT JOIN makes m ON v.make = m.make_name
      WHERE sr.dealer_id = $1
        AND v.make IS NOT NULL
        AND v.make != ''
      GROUP BY v.make, m.warranty_eligible, m.id
      ORDER BY v.make ASC
    `;

    const makes = await prisma.$queryRawUnsafe<any[]>(query, dealerId);

    return jsonResponse(makes);
  } catch (error) {
    console.error("Error fetching makes:", error);
    return NextResponse.json(
      { error: "Failed to fetch makes" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer-settings/makes
 * Update warranty eligibility for makes
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
    const { makes } = body; // Array of { name: string, is_warranty_eligible: boolean }

    if (!makes || !Array.isArray(makes)) {
      return NextResponse.json(
        { error: "makes array is required" },
        { status: 400 }
      );
    }

    // Update or insert make records (makes table is global, no dealer_id)
    for (const make of makes) {
      const { name, is_warranty_eligible } = make;

      // Check if make exists
      const existingMake = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM makes WHERE make_name = $1 LIMIT 1`,
        name
      );

      if (existingMake.length > 0) {
        // Update existing
        await prisma.$executeRawUnsafe(
          `UPDATE makes SET warranty_eligible = $1, updated_at = NOW() WHERE id = $2`,
          is_warranty_eligible,
          existingMake[0].id
        );
      } else {
        // Insert new
        await prisma.$executeRawUnsafe(
          `INSERT INTO makes (make_name, warranty_eligible, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW())`,
          name,
          is_warranty_eligible
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating makes:", error);
    return NextResponse.json(
      { error: "Failed to update makes" },
      { status: 500 }
    );
  }
}

