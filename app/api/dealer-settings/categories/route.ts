import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  requireDealerWriteAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/categories
 * List all service categories for a dealer with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");
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

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const categories = await prisma.serviceCategory.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return jsonResponse(categories);
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dealer-settings/categories
 * Create a new service category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealerId, name, isActive = true } = body;

    if (!dealerId) {
      return NextResponse.json(
        { error: "dealerId is required" },
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

    // Check for duplicate category name (case-insensitive)
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        dealerId,
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists for this dealer" },
        { status: 409 }
      );
    }

    const category = await prisma.serviceCategory.create({
      data: {
        dealerId,
        name: name.trim(),
        isActive,
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return jsonResponse(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service category:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name already exists for this dealer" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service category" },
      { status: 500 }
    );
  }
}
