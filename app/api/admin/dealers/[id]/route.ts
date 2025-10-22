import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth/middleware";
import { prismaDb, prisma } from "@/lib/db/prisma-admin-data";
import { DealerInput } from "@/lib/types/admin";

/**
 * GET /api/admin/dealers/[id]
 * Retrieve a specific dealer
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
    const dealer = await prismaDb.dealers.findById(id);

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    return NextResponse.json(dealer);
  } catch (error) {
    console.error("Error fetching dealer:", error);
    return NextResponse.json(
      { error: "Failed to fetch dealer" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/dealers/[id]
 * Update a dealer
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
    const body: Partial<DealerInput> = await request.json();

    const updatedDealer = await prismaDb.dealers.update(id, body);

    if (!updatedDealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDealer);
  } catch (error) {
    console.error("Error updating dealer:", error);
    return NextResponse.json(
      { error: "Failed to update dealer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/dealers/[id]
 * Delete a dealer
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

    // Check if dealer exists
    const dealer = await prismaDb.dealers.findById(id);
    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Check if any users have this as their default dealer
    const usersWithDefaultDealer = await prisma.user.count({
      where: { defaultDealerId: id },
    });

    if (usersWithDefaultDealer > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete dealer. ${usersWithDefaultDealer} user(s) have this dealer as their default. Please change their default dealer first.`,
        },
        { status: 400 }
      );
    }

    // Check for data in key tables that might block deletion
    const dataChecks = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM service_record WHERE dealer_id = '${id}'`
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM customer WHERE dealer_id = '${id}'`
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM vehicle WHERE dealer_id = '${id}'`
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM parts_inventory WHERE dealer_id = '${id}'`
      ),
    ]);

    const totalRecords = dataChecks.reduce(
      (sum: number, result: any) => sum + Number(result[0].count),
      0
    );

    if (totalRecords > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete dealer. There are ${totalRecords} related records (service records, customers, vehicles, parts). Please clean up data first.`,
        },
        { status: 400 }
      );
    }

    // All checks passed, proceed with deletion
    // The user_dealers relationships will cascade delete automatically
    const success = await prismaDb.dealers.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete dealer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Dealer deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting dealer:", error);
    return NextResponse.json(
      {
        error: "Failed to delete dealer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
