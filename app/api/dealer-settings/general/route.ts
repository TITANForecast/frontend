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
          warrantyRequestCooldownPeriod: 180,
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
      lastLaborRateSubmission: settings.lastLaborRateSubmission
        ? settings.lastLaborRateSubmission.toISOString()
        : null,
      lastPartsProfitSubmission: settings.lastPartsProfitSubmission
        ? settings.lastPartsProfitSubmission.toISOString()
        : null,
      warrantyRequestCooldownPeriod:
        settings.warrantyRequestCooldownPeriod ?? 180,
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
    const {
      currentWarrantyLaborRate,
      currentWarrantyPartsMarkup,
      lastLaborRateSubmission,
      lastPartsProfitSubmission,
      warrantyRequestCooldownPeriod,
    } = body;

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

    // Validate cooldown period
    if (
      warrantyRequestCooldownPeriod !== null &&
      warrantyRequestCooldownPeriod !== undefined &&
      (typeof warrantyRequestCooldownPeriod !== "number" ||
        isNaN(warrantyRequestCooldownPeriod) ||
        warrantyRequestCooldownPeriod < 0)
    ) {
      return NextResponse.json(
        {
          error: "warrantyRequestCooldownPeriod must be a non-negative number",
        },
        { status: 400 }
      );
    }

    // Validate dates
    let parsedLastLaborRateSubmission: Date | null = null;
    if (lastLaborRateSubmission) {
      parsedLastLaborRateSubmission = new Date(lastLaborRateSubmission);
      if (isNaN(parsedLastLaborRateSubmission.getTime())) {
        return NextResponse.json(
          { error: "lastLaborRateSubmission must be a valid date" },
          { status: 400 }
        );
      }
    }

    let parsedLastPartsProfitSubmission: Date | null = null;
    if (lastPartsProfitSubmission) {
      parsedLastPartsProfitSubmission = new Date(lastPartsProfitSubmission);
      if (isNaN(parsedLastPartsProfitSubmission.getTime())) {
        return NextResponse.json(
          { error: "lastPartsProfitSubmission must be a valid date" },
          { status: 400 }
        );
      }
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
        lastLaborRateSubmission: parsedLastLaborRateSubmission,
        lastPartsProfitSubmission: parsedLastPartsProfitSubmission,
        warrantyRequestCooldownPeriod:
          warrantyRequestCooldownPeriod !== null &&
          warrantyRequestCooldownPeriod !== undefined
            ? warrantyRequestCooldownPeriod
            : 180,
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
        lastLaborRateSubmission: parsedLastLaborRateSubmission,
        lastPartsProfitSubmission: parsedLastPartsProfitSubmission,
        warrantyRequestCooldownPeriod:
          warrantyRequestCooldownPeriod !== null &&
          warrantyRequestCooldownPeriod !== undefined
            ? warrantyRequestCooldownPeriod
            : 180,
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
      lastLaborRateSubmission: settings.lastLaborRateSubmission
        ? settings.lastLaborRateSubmission.toISOString()
        : null,
      lastPartsProfitSubmission: settings.lastPartsProfitSubmission
        ? settings.lastPartsProfitSubmission.toISOString()
        : null,
      warrantyRequestCooldownPeriod:
        settings.warrantyRequestCooldownPeriod ?? 180,
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
