import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/dealer-settings/general
 * Fetch general settings for a dealer
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

    // Fetch or create general settings
    let settings = await prisma.dealerGeneralSettings.findUnique({
      where: { dealerId },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.dealerGeneralSettings.create({
        data: {
          dealerId,
          currentWarrantyLaborRate: null,
          currentWarrantyPartsMarkup: null,
        },
      });
    }

    return jsonResponse({
      id: settings.id,
      dealerId: settings.dealerId,
      currentWarrantyLaborRate: settings.currentWarrantyLaborRate
        ? parseFloat(String(settings.currentWarrantyLaborRate))
        : null,
      currentWarrantyPartsMarkup: settings.currentWarrantyPartsMarkup
        ? parseFloat(String(settings.currentWarrantyPartsMarkup))
        : null,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching general settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch general settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dealer-settings/general
 * Update general settings for a dealer
 */
export async function PUT(request: NextRequest) {
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
    const { currentWarrantyLaborRate, currentWarrantyPartsMarkup } = body;

    // Validate inputs
    if (
      currentWarrantyLaborRate !== null &&
      currentWarrantyLaborRate !== undefined &&
      (typeof currentWarrantyLaborRate !== "number" ||
        isNaN(currentWarrantyLaborRate) ||
        currentWarrantyLaborRate < 0)
    ) {
      return NextResponse.json(
        { error: "currentWarrantyLaborRate must be a non-negative number" },
        { status: 400 }
      );
    }

    if (
      currentWarrantyPartsMarkup !== null &&
      currentWarrantyPartsMarkup !== undefined &&
      (typeof currentWarrantyPartsMarkup !== "number" ||
        isNaN(currentWarrantyPartsMarkup) ||
        currentWarrantyPartsMarkup < 0)
    ) {
      return NextResponse.json(
        { error: "currentWarrantyPartsMarkup must be a non-negative number" },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.dealerGeneralSettings.upsert({
      where: { dealerId },
      update: {
        currentWarrantyLaborRate:
          currentWarrantyLaborRate !== null &&
          currentWarrantyLaborRate !== undefined
            ? currentWarrantyLaborRate
            : null,
        currentWarrantyPartsMarkup:
          currentWarrantyPartsMarkup !== null &&
          currentWarrantyPartsMarkup !== undefined
            ? currentWarrantyPartsMarkup
            : null,
      },
      create: {
        dealerId,
        currentWarrantyLaborRate:
          currentWarrantyLaborRate !== null &&
          currentWarrantyLaborRate !== undefined
            ? currentWarrantyLaborRate
            : null,
        currentWarrantyPartsMarkup:
          currentWarrantyPartsMarkup !== null &&
          currentWarrantyPartsMarkup !== undefined
            ? currentWarrantyPartsMarkup
            : null,
      },
    });

    return jsonResponse({
      id: settings.id,
      dealerId: settings.dealerId,
      currentWarrantyLaborRate: settings.currentWarrantyLaborRate
        ? parseFloat(String(settings.currentWarrantyLaborRate))
        : null,
      currentWarrantyPartsMarkup: settings.currentWarrantyPartsMarkup
        ? parseFloat(String(settings.currentWarrantyPartsMarkup))
        : null,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error updating general settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to update general settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
