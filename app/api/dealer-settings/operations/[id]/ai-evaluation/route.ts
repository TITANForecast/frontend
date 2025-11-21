import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://data-api-staging.titanforecast.com";

/**
 * GET /api/dealer-settings/operations/[id]/ai-evaluation
 * Get latest AI evaluation for an operation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operationId = id;
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get("dealerId");

    if (!operationId) {
      return NextResponse.json(
        { error: "operation_id is required" },
        { status: 400 }
      );
    }

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

    // Get authorization header from request
    const authHeader = request.headers.get("Authorization");

    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/v1/operations/${operationId}/ai-evaluation`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        error: "Failed to get AI evaluation",
      }));
      return NextResponse.json(errorData, {
        status: backendResponse.status,
      });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting AI evaluation:", error);
    return NextResponse.json(
      { error: "Failed to get AI evaluation" },
      { status: 500 }
    );
  }
}

