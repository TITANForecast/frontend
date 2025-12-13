import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

/**
 * GET /api/reports/saved
 * Fetch saved reports for the current user
 * Query params:
 * - reportType: "custom-ro" | "custom-opcode" (optional)
 * - visibility: "local" | "public" | "all" (optional, defaults to "all")
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Decode JWT token to get Cognito sub
    let cognitoSub: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
      const payload = JSON.parse(payloadJson);
      cognitoSub = payload.sub;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!cognitoSub) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("reportType");
    const visibility = searchParams.get("visibility") || "all";

    // Build query
    const where: any = {};

    if (reportType) {
      where.reportType = reportType;
    }

    // Filter by visibility
    if (visibility === "local") {
      where.createdBy = user.id;
      where.visibility = "local";
    } else if (visibility === "public") {
      where.visibility = "public";
    } else {
      // Show both public reports and user's local reports
      where.OR = [
        { visibility: "public" },
        { createdBy: user.id, visibility: "local" },
      ];
    }

    const savedReports = await prisma.savedReport.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ visibility: "desc" }, { name: "asc" }],
    });

    return jsonResponse({ success: true, data: savedReports });
  } catch (error: any) {
    console.error("Error fetching saved reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/saved
 * Create a new saved report
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Decode JWT token to get Cognito sub
    let cognitoSub: string;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
      const payload = JSON.parse(payloadJson);
      cognitoSub = payload.sub;
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!cognitoSub) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      reportType,
      visibility,
      allowFilters,
      filters,
      grouping,
      columnState,
      dealerId,
    } = body;

    // Validation
    if (!name || !reportType) {
      return NextResponse.json(
        { error: "Name and reportType are required" },
        { status: 400 }
      );
    }

    // Check if user can create public reports (Super Admin only)
    if (visibility === "public" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can create public reports" },
        { status: 403 }
      );
    }

    // Create saved report
    const savedReport = await prisma.savedReport.create({
      data: {
        name,
        reportType,
        visibility: visibility || "local",
        allowFilters: allowFilters ?? true,
        filters: filters || {},
        grouping: grouping || {},
        columnState: columnState || {},
        createdBy: user.id,
        dealerId: dealerId || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return jsonResponse({ success: true, data: savedReport }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating saved report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create saved report" },
      { status: 500 }
    );
  }
}
