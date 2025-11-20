import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://data-api-staging.titanforecast.com";

/**
 * POST /api/operations/{operation_id}/evaluate-ai
 * Trigger AI evaluation for an operation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operationId = id;

    if (!operationId) {
      return NextResponse.json(
        { error: "operation_id is required" },
        { status: 400 }
      );
    }

    // Get authorization header from request
    const authHeader = request.headers.get("Authorization");

    // Forward request to backend
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/v1/operations/${operationId}/evaluate-ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({
        error: "Failed to evaluate operation",
      }));
      return NextResponse.json(errorData, {
        status: backendResponse.status,
      });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error evaluating operation:", error);
    return NextResponse.json(
      { error: "Failed to evaluate operation" },
      { status: 500 }
    );
  }
}
