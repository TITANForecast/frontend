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
  let operationId: string | undefined;
  let dealerId: string | null = null;
  
  try {
    const { id } = await params;
    operationId = id;
    const { searchParams } = new URL(request.url);
    dealerId = searchParams.get("dealerId");

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

    // Build backend URL
    const backendUrl = `${BACKEND_API_URL}/api/v1/operations/${operationId}/ai-evaluation`;
    
    console.log("Forwarding request to backend:", {
      backendUrl,
      BACKEND_API_URL,
      operationId,
      dealerId,
      hasAuthHeader: !!authHeader,
    });

    // Forward request to backend
    const backendResponse = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!backendResponse.ok) {
      let errorData;
      try {
        errorData = await backendResponse.json();
      } catch (parseError) {
        errorData = {
          error: "Failed to get AI evaluation",
          status: backendResponse.status,
          statusText: backendResponse.statusText,
        };
      }
      
      // Handle 404 as informational (no evaluation found) - not an error
      if (backendResponse.status === 404) {
        return NextResponse.json(
          {
            notFound: true,
            message: errorData.detail || errorData.message || "No AI evaluation found for this operation",
            operationId,
            dealerId,
          },
          { status: 200 }
        );
      }
      
      console.error("Backend API error:", {
        operationId,
        dealerId,
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        errorData,
        backendUrl: `${BACKEND_API_URL}/api/v1/operations/${operationId}/ai-evaluation`,
      });

      return NextResponse.json(
        {
          error: errorData.error || "Failed to get AI evaluation",
          details: errorData.details || errorData.message || errorData,
          status: backendResponse.status,
          operationId,
          dealerId,
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error getting AI evaluation:", {
      error: errorMessage,
      stack: errorStack,
      operationId,
      dealerId,
      backendUrl: operationId ? `${BACKEND_API_URL}/api/v1/operations/${operationId}/ai-evaluation` : "N/A",
    });

    const backendUrl = operationId 
      ? `${BACKEND_API_URL}/api/v1/operations/${operationId}/ai-evaluation` 
      : "N/A";

    return NextResponse.json(
      {
        error: "Failed to get AI evaluation",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
        operationId: operationId || "unknown",
        dealerId: dealerId || "unknown",
        backendUrl,
        BACKEND_API_URL,
      },
      { status: 500 }
    );
  }
}

