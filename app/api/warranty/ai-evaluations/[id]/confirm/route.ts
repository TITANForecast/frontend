import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://data-api-staging.titanforecast.com";

/**
 * POST /api/warranty/ai-evaluations/{evaluation_id}/confirm
 * Confirm or deny an AI evaluation recommendation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evaluationId = id;

    if (!evaluationId) {
      return NextResponse.json(
        { error: "evaluation_id is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { confirmed } = body;

    if (typeof confirmed !== "boolean") {
      return NextResponse.json(
        { error: "confirmed must be a boolean" },
        { status: 400 }
      );
    }

    // Get authorization header from request
    const authHeader = request.headers.get("Authorization");

    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/v1/warranty/ai-evaluations/${evaluationId}/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify({ confirmed }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        error: "Failed to confirm evaluation",
      }));
      return NextResponse.json(errorData, {
        status: backendResponse.status,
      });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error confirming evaluation:", error);
    return NextResponse.json(
      { error: "Failed to confirm evaluation" },
      { status: 500 }
    );
  }
}
