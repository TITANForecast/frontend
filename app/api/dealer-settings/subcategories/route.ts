import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/subcategories
 * List all service subcategories for a dealer with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
    const categoryId = searchParams.get("categoryId");
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

    if (categoryId) {
      where.categoryId = BigInt(categoryId);
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const subcategories = await prisma.serviceSubcategory.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    return jsonResponse(subcategories);
  } catch (error) {
    console.error("Error fetching service subcategories:", error);
    return NextResponse.json(
      { error: "Failed to fetch service subcategories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dealer-settings/subcategories
 * Create a new service subcategory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId, categoryId, name, isActive = true } = body;

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
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

    // Check for duplicate subcategory name within category (case-insensitive)
    const existing = await prisma.serviceSubcategory.findFirst({
      where: {
        dealerId,
        categoryId: BigInt(categoryId),
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "A subcategory with this name already exists in this category",
        },
        { status: 409 }
      );
    }

    const subcategory = await prisma.serviceSubcategory.create({
      data: {
        dealerId,
        categoryId: BigInt(categoryId),
        name: name.trim(),
        isActive,
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

    return jsonResponse(subcategory, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service subcategory:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "A subcategory with this name already exists in this category",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service subcategory" },
      { status: 500 }
    );
  }
}
