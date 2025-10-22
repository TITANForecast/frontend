import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth/middleware";
import { prismaDb } from "@/lib/db/prisma-admin-data";
import { DealerApiConfigInput } from "@/lib/types/admin";

/**
 * GET /api/admin/dealers/[id]/config
 * Retrieve API config for a dealer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const config = await prismaDb.apiConfigs.findByDealerId(id);

    if (!config) {
      return NextResponse.json(
        { error: "API config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching API config:", error);
    return NextResponse.json(
      { error: "Failed to fetch API config" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dealers/[id]/config
 * Create or update API config for a dealer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    console.log("POST /api/admin/dealers/[id]/config - Dealer ID:", id);

    const body: DealerApiConfigInput = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Validation
    if (!body.dataSource || !body.rooftopId || !body.programId) {
      return NextResponse.json(
        {
          error:
            "Missing required API config fields: Data Source, Rooftop ID, Program ID",
        },
        { status: 400 }
      );
    }

    // Validate dataSource
    if (
      body.dataSource !== "Certify-Staging" &&
      body.dataSource !== "DealerVault-Production"
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid Data Source. Must be either "Certify-Staging" or "DealerVault-Production"',
        },
        { status: 400 }
      );
    }

    // Check if dealer exists
    const dealer = await prismaDb.dealers.findById(id);
    if (!dealer) {
      console.error("Dealer not found:", id);
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }
    console.log("Dealer found:", dealer.name);

    // Check if config already exists
    const existingConfig = await prismaDb.apiConfigs.findByDealerId(id);
    console.log(
      "Existing config:",
      existingConfig ? "Found (updating)" : "Not found (creating)"
    );

    const configData = {
      dealerId: id,
      dataSource: body.dataSource,
      rooftopId: body.rooftopId,
      programId: body.programId,
      fileTypeCodes:
        body.fileTypeCodes && body.fileTypeCodes.length > 0
          ? body.fileTypeCodes
          : ["SV"],
      compareDateDefault: body.compareDateDefault ?? 1,
      lastSuccess: null,
      lastError: null,
      isActive: body.isActive ?? true,
    };

    let result;
    if (existingConfig) {
      result = await prismaDb.apiConfigs.update(existingConfig.id, configData);
      if (!result) {
        return NextResponse.json(
          { error: "Failed to update API config" },
          { status: 500 }
        );
      }
    } else {
      result = await prismaDb.apiConfigs.create(configData);
    }

    return NextResponse.json(result, { status: existingConfig ? 200 : 201 });
  } catch (error: any) {
    console.error("Error creating/updating API config:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to save API config";

    if (error.code === "P2002") {
      errorMessage = "API config already exists for this dealer";
    } else if (error.code === "P2003") {
      errorMessage = "Invalid dealer ID - dealer not found";
    } else if (error.message) {
      errorMessage = `Database error: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/dealers/[id]/config
 * Delete API config for a dealer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const config = await prismaDb.apiConfigs.findByDealerId(id);

    if (!config) {
      return NextResponse.json(
        { error: "API config not found" },
        { status: 404 }
      );
    }

    await prismaDb.apiConfigs.delete(config.id);
    return NextResponse.json({ message: "API config deleted successfully" });
  } catch (error) {
    console.error("Error deleting API config:", error);
    return NextResponse.json(
      { error: "Failed to delete API config" },
      { status: 500 }
    );
  }
}
