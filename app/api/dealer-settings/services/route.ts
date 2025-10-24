import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/services
 * List all services for a dealer with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const categoryIds =
      searchParams.get("categoryId") || searchParams.get("categoryIds");
    const subcategoryIds =
      searchParams.get("subcategoryId") || searchParams.get("subcategoryIds");
    const isActive = searchParams.get("isActive");

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

    const where: any = { dealerId };

    // Support multi-select for categories (comma-separated IDs)
    if (categoryIds) {
      const categoryIdArray = categoryIds
        .split(",")
        .map((id) => BigInt(id.trim()));
      if (categoryIdArray.length === 1) {
        where.categoryId = categoryIdArray[0];
      } else {
        where.categoryId = { in: categoryIdArray };
      }
    }

    // Support multi-select for subcategories (comma-separated IDs)
    if (subcategoryIds) {
      const subcategoryIdArray = subcategoryIds
        .split(",")
        .map((id) => BigInt(id.trim()));
      if (subcategoryIdArray.length === 1) {
        where.subcategoryId = subcategoryIdArray[0];
      } else {
        where.subcategoryId = { in: subcategoryIdArray };
      }
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
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

    return jsonResponse(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dealer-settings/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId, name, categoryId, subcategoryId, isActive = true } = body;

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
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

    // Verify subcategory if provided
    if (subcategoryId) {
      const subcategory = await prisma.serviceSubcategory.findFirst({
        where: {
          id: BigInt(subcategoryId),
          dealerId,
          categoryId: BigInt(categoryId),
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

    // Check for duplicate service name within category/subcategory (case-insensitive)
    const existing = await prisma.service.findFirst({
      where: {
        dealerId,
        categoryId: BigInt(categoryId),
        subcategoryId: subcategoryId ? BigInt(subcategoryId) : null,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "A service with this name already exists in this category/subcategory combination",
        },
        { status: 409 }
      );
    }

    // Check if user exists in database (for audit fields)
    const userExists = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    const service = await prisma.service.create({
      data: {
        dealerId,
        name: name.trim(),
        categoryId: BigInt(categoryId),
        subcategoryId: subcategoryId ? BigInt(subcategoryId) : null,
        isActive,
        createdBy: userExists ? auth.user.id : null,
        updatedBy: userExists ? auth.user.id : null,
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

    return jsonResponse(service, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service:", error);

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
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
