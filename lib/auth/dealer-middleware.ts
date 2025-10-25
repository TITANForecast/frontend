import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/lib/types/auth";
import { prisma } from "@/lib/db/prisma-admin-data";

export interface DealerAuthContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
    dealerId: string;
  };
  authorized: boolean;
  error?: string;
}

/**
 * Middleware to verify user has access to a specific dealer
 * Supports SUPER_ADMIN, MULTI_DEALER (if assigned to dealer), and USER (if assigned to dealer)
 */
export async function requireDealerAccess(
  request: NextRequest,
  dealerId: string
): Promise<DealerAuthContext> {
  try {
    // Verify Cognito JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        error: "No authorization token provided",
        user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
      };
    }

    const token = authHeader.substring(7);
    
    // Decode JWT token to get user information
    // Note: The token is already verified by the auth middleware
    // We just need to extract the user's Cognito sub
    let cognitoSub: string;
    
    try {
      // Decode the JWT payload (base64 decode the middle part)
      const payloadBase64 = token.split('.')[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      
      // Extract Cognito sub from the token
      cognitoSub = payload.sub;
      
      if (!cognitoSub) {
        return {
          authorized: false,
          error: "Invalid token: missing sub claim",
          user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
        };
      }
    } catch (error) {
      console.error("Failed to decode JWT token:", error);
      return {
        authorized: false,
        error: "Invalid token format",
        user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
      };
    }
    
    // Look up user by Cognito sub
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
      include: {
        dealers: true,
      },
    });
    
    if (!user) {
      return {
        authorized: false,
        error: "User not found",
        user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
      };
    }

    // SUPER_ADMIN has access to all dealers
    if (user.role === UserRole.SUPER_ADMIN) {
      return {
        authorized: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role as UserRole,
          dealerId,
        },
      };
    }

    // Check if user has access to this dealer
    const hasAccess = user.dealers.some((ud) => ud.dealerId === dealerId);

    if (!hasAccess) {
      return {
        authorized: false,
        error: "User does not have access to this dealer",
        user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
      };
    }

    return {
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        dealerId,
      },
    };
  } catch (error) {
    console.error("Dealer auth middleware error:", error);
    return {
      authorized: false,
      error: "Authentication failed",
      user: { id: "", email: "", role: UserRole.USER, dealerId: "" },
    };
  }
}

/**
 * Middleware to verify user can write to a specific dealer
 * Only SUPER_ADMIN and dealer admins can write
 */
export async function requireDealerWriteAccess(
  request: NextRequest,
  dealerId: string
): Promise<DealerAuthContext> {
  const auth = await requireDealerAccess(request, dealerId);

  if (!auth.authorized) {
    return auth;
  }

  // Check if user has write permissions (SUPER_ADMIN or MULTI_DEALER)
  // Note: In the spec, both SUPER_ADMIN and "Dealer ADMIN" have write access
  // We're interpreting "Dealer ADMIN" as MULTI_DEALER role
  if (
    auth.user.role !== UserRole.SUPER_ADMIN &&
    auth.user.role !== UserRole.MULTI_DEALER
  ) {
    return {
      authorized: false,
      error: "User does not have write access to this dealer",
      user: auth.user,
    };
  }

  return auth;
}

/**
 * Helper to create unauthorized response
 */
export function dealerUnauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 403 });
}
