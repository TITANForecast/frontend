import { NextRequest, NextResponse } from "next/server";
import {
  requireDealerAccess,
  dealerUnauthorizedResponse,
} from "@/lib/auth/dealer-middleware";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://data-api-staging.titanforecast.com";

/**
 * POST /api/dealer-settings/operations/batch-evaluate-ai
 * Trigger AI evaluation for multiple operations in batch
 */
export async function POST(request: NextRequest) {
  let dealerId: string | null = null;

  try {
    const body = await request.json();
    const { operation_ids, max_workers, dealerId: bodyDealerId } = body;

    // Get dealerId from body or query params
    const { searchParams } = new URL(request.url);
    dealerId = bodyDealerId || searchParams.get("dealerId");

    if (
      !operation_ids ||
      !Array.isArray(operation_ids) ||
      operation_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "operation_ids array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (operation_ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 operations can be evaluated per request" },
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

    // Prepare request body for backend
    const backendBody: any = {
      operation_ids,
    };
    if (max_workers !== undefined) {
      backendBody.max_workers = max_workers;
    }

    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/v1/operations/batch-evaluate-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(backendBody),
      }
    );

    if (!backendResponse.ok) {
      let errorData;
      try {
        errorData = await backendResponse.json();
      } catch (parseError) {
        errorData = {
          error: "Failed to evaluate operations",
          status: backendResponse.status,
          statusText: backendResponse.statusText,
        };
      }

      console.error("Backend API error:", {
        operation_ids,
        dealerId,
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorData,
        backendUrl: `${BACKEND_API_URL}/api/v1/operations/batch-evaluate-ai`,
      });

      return NextResponse.json(
        {
          error: errorData.error || "Failed to evaluate operations",
          details: errorData.details || errorData.message || errorData,
          status: backendResponse.status,
          operation_ids,
          dealerId,
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error evaluating operations:", {
      error: errorMessage,
      stack: errorStack,
      dealerId,
      backendUrl: `${BACKEND_API_URL}/api/v1/operations/batch-evaluate-ai`,
    });

    return NextResponse.json(
      {
        error: "Failed to evaluate operations",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
        dealerId: dealerId || "unknown",
      },
      { status: 500 }
    );
  }
}
