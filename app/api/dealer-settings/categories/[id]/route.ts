import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/categories/[id]
 * Retrieve a specific service category
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

    const category = await prisma.serviceCategory.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
      include: {
        _count: {
          select: { services: true, subcategories: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return jsonResponse(category);
  } catch (error) {
    console.error("Error fetching service category:", error);
    return NextResponse.json(
      { error: "Failed to fetch service category" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer-settings/categories/[id]
 * Update a service category
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

    // Verify category exists and belongs to dealer
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.serviceCategory.findFirst({
        where: {
          dealerId,
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
          { error: "A category with this name already exists for this dealer" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await prisma.serviceCategory.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        _count: {
          select: { services: true, subcategories: true },
        },
      },
    });

    return jsonResponse(category);
  } catch (error: any) {
    console.error("Error updating service category:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists for this dealer" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update service category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dealer-settings/categories/[id]
 * Delete a service category (only if no services reference it)
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

    // Verify category exists and belongs to dealer
    const category = await prisma.serviceCategory.findFirst({
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

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if any services reference this category
    if (category._count.services > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${category._count.services} service(s) are using this category. Please reassign or delete those services first.`,
        },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting service category:", error);
    return NextResponse.json(
      { error: "Failed to delete service category" },
      { status: 500 }
    );
  }
}
