import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma-admin-data";
import { jsonResponse } from "@/lib/utils/bigint-json";

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // Decode JWT token to get Cognito sub
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);
    const cognitoSub = payload.sub;

    if (!cognitoSub) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });

    return user;
  } catch (e) {
    return null;
  }
}

/**
 * GET /api/reports/saved/[id]
 * Fetch a single saved report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id },
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

    if (!savedReport) {
      return NextResponse.json(
        { error: "Saved report not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this report
    const hasAccess =
      savedReport.visibility === "public" || savedReport.createdBy === user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this report" },
        { status: 403 }
      );
    }

    return jsonResponse({ success: true, data: savedReport });
  } catch (error: any) {
    console.error("Error fetching saved report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved report" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reports/saved/[id]
 * Update a saved report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id },
    });

    if (!savedReport) {
      return NextResponse.json(
        { error: "Saved report not found" },
        { status: 404 }
      );
    }

    // Check edit permissions
    // Local reports: only creator can edit
    // Public reports: only Super Admins can edit
    const canEdit =
      (savedReport.visibility === "local" &&
        savedReport.createdBy === user.id) ||
      (savedReport.visibility === "public" && user.role === "SUPER_ADMIN");

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this report" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      visibility,
      allowFilters,
      filters,
      grouping,
      columnState,
      dealerId,
    } = body;

    // If changing to public, check user role
    if (visibility === "public" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can create public reports" },
        { status: 403 }
      );
    }

    // Update saved report
    const updatedReport = await prisma.savedReport.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(visibility && { visibility }),
        ...(allowFilters !== undefined && { allowFilters }),
        ...(filters && { filters }),
        ...(grouping && { grouping }),
        ...(columnState && { columnState }),
        ...(dealerId !== undefined && { dealerId }),
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

    return jsonResponse({ success: true, data: updatedReport });
  } catch (error: any) {
    console.error("Error updating saved report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update saved report" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/saved/[id]
 * Delete a saved report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedReport = await prisma.savedReport.findUnique({
      where: { id },
    });

    if (!savedReport) {
      return NextResponse.json(
        { error: "Saved report not found" },
        { status: 404 }
      );
    }

    // Check delete permissions (same as edit permissions)
    const canDelete =
      (savedReport.visibility === "local" &&
        savedReport.createdBy === user.id) ||
      (savedReport.visibility === "public" && user.role === "SUPER_ADMIN");

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this report" },
        { status: 403 }
      );
    }

    await prisma.savedReport.delete({
      where: { id },
    });

    return jsonResponse({ success: true, message: "Report deleted" });
  } catch (error: any) {
    console.error("Error deleting saved report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete saved report" },
      { status: 500 }
    );
  }
}
