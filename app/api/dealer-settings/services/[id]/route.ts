import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/services/[id]
 * Retrieve a specific service
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

    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return jsonResponse(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dealer-settings/services/[id]
 * Update a service (including soft delete via isActive)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dealerId, name, categoryId, subcategoryId, isActive } = body;

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

    // Verify service exists and belongs to dealer
    const existing = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify category if being changed
    if (categoryId && categoryId !== existing.categoryId.toString()) {
      const category = await prisma.serviceCategory.findFirst({
        where: {
          id: BigInt(categoryId),
          dealerId,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found or does not belong to this dealer" },
          { status: 404 }
        );
      }
    }

    // Verify subcategory if provided
    if (subcategoryId) {
      const targetCategoryId = categoryId
        ? BigInt(categoryId)
        : existing.categoryId;
      const subcategory = await prisma.serviceSubcategory.findFirst({
        where: {
          id: BigInt(subcategoryId),
          dealerId,
          categoryId: targetCategoryId,
        },
      });

      if (!subcategory) {
        return NextResponse.json(
          {
            error: "Subcategory not found or does not belong to this category",
          },
          { status: 404 }
        );
      }
    }

    // Check for duplicate name if name, category, or subcategory is being changed
    const nameChanged = name && name.trim() !== existing.name;
    const categoryChanged =
      categoryId && categoryId !== existing.categoryId.toString();
    const subcategoryChanged =
      subcategoryId !== undefined &&
      (subcategoryId ? BigInt(subcategoryId) : null) !==
        (existing.subcategoryId ? existing.subcategoryId : null);

    if (nameChanged || categoryChanged || subcategoryChanged) {
      const duplicate = await prisma.service.findFirst({
        where: {
          dealerId,
          categoryId: categoryId ? BigInt(categoryId) : existing.categoryId,
          subcategoryId:
            subcategoryId !== undefined
              ? subcategoryId
                ? BigInt(subcategoryId)
                : null
              : existing.subcategoryId,
          name: {
            equals: name ? name.trim() : existing.name,
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
              "A service with this name already exists in this category/subcategory combination",
          },
          { status: 409 }
        );
      }
    }

    // Check if user exists in database (for audit fields)
    const userExists = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    const updateData: any = {
      updatedBy: userExists ? auth.user.id : null,
    };
    if (name !== undefined) updateData.name = name.trim();
    if (categoryId !== undefined) updateData.categoryId = BigInt(categoryId);
    if (subcategoryId !== undefined)
      updateData.subcategoryId = subcategoryId ? BigInt(subcategoryId) : null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await prisma.service.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
        subcategory: {
          select: { id: true, name: true },
        },
        createdByUser: {
          select: { id: true, name: true, email: true },
        },
        updatedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return jsonResponse(service);
  } catch (error: any) {
    console.error("Error updating service:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "A service with this name already exists in this category/subcategory combination",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dealer-settings/services/[id]
 * Hard delete a service (note: operations table is outside Prisma, so this is allowed)
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

    // Verify service exists and belongs to dealer
    const service = await prisma.service.findFirst({
      where: {
        id: BigInt(id),
        dealerId,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if any operations reference this service
    // Note: Operations table is outside Prisma, so we'll do a raw query
    const operationsCount = await prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM operation WHERE service_id = ${id} AND dealer_id = '${dealerId}'`
    );

    const count = Number(operationsCount[0]?.count || 0);

    if (count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete service. ${count} operation(s) are using this service. Please reassign those operations first or deactivate this service instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      message: "Service deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
