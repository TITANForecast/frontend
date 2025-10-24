import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/subcategories/[id]
 * Retrieve a specific service subcategory
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const subcategory = await prisma.serviceSubcategory.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    return jsonResponse(subcategory);
  } catch (error) {
    console.error("Error fetching service subcategory:", error);
    return NextResponse.json(
      { error: "Failed to fetch service subcategory" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer-settings/subcategories/[id]
 * Update a service subcategory
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dealerId, name, isActive } = body;

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

    // Verify subcategory exists and belongs to dealer
    const existing = await prisma.serviceSubcategory.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.serviceSubcategory.findFirst({
        where: {
          dealerId,
          categoryId: existing.categoryId,
          name: {
            equals: name.trim(),
            mode: "insensitive",
          },
          id: {
            not: BigInt(id),
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A subcategory with this name already exists in this category",
          },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const subcategory = await prisma.serviceSubcategory.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    return jsonResponse(subcategory);
  } catch (error: any) {
    console.error("Error updating service subcategory:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "A subcategory with this name already exists in this category",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update service subcategory" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dealer-settings/subcategories/[id]
 * Delete a service subcategory (only if no services reference it)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");

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

    // Verify subcategory exists and belongs to dealer
    const subcategory = await prisma.serviceSubcategory.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!subcategory) {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }

    // Check if any services reference this subcategory
    if (subcategory._count.services > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subcategory. ${subcategory._count.services} service(s) are using this subcategory. Please reassign or delete those services first.`,
        },
        { status: 400 }
      );
    }

    await prisma.serviceSubcategory.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      message: "Subcategory deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting service subcategory:", error);
    return NextResponse.json(
      { error: "Failed to delete service subcategory" },
      { status: 500 }
    );
  }
}
