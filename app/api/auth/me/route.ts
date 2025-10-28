import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

// Simple JWT decode function (for development - in production use proper JWT verification)
function decodeJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}

async function getUserFromToken(request: NextRequest) {
  // Get authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No authorization token provided");
  }

  const token = authHeader.substring(7);

  // Decode JWT token to get user info
  const decodedToken = decodeJWT(token);
  if (!decodedToken) {
    throw new Error("Invalid token");
  }

  const { sub, email, name } = decodedToken;
  console.log("Decoded token:", { sub, email, name });

  // Look up user in database by cognitoSub first
  let user = await prisma.user.findUnique({
    where: { cognitoSub: sub },
    include: {
      defaultDealer: true,
      dealers: {
        include: {
          dealer: true,
        },
      },
    },
  });

  // If not found by cognitoSub, try to find by email (for pre-provisioned users)
  if (!user) {
    console.log("User not found by cognitoSub, trying email lookup:", email);

    // Try exact email match first
    user = await prisma.user.findUnique({
      where: { email },
      include: {
        defaultDealer: true,
        dealers: {
          include: {
            dealer: true,
          },
        },
      },
    });

    // If still not found, try to find by email prefix (for cases like lionel.robin528 vs lionel.robin528@gmail.com)
    if (!user && email.includes("@")) {
      const emailPrefix = email.split("@")[0];
      console.log("Trying email prefix lookup:", emailPrefix);

      // Find users where email starts with the prefix
      const users = await prisma.user.findMany({
        where: {
          email: {
            startsWith: emailPrefix,
          },
        },
        include: {
          defaultDealer: true,
          dealers: {
            include: {
              dealer: true,
            },
          },
        },
      });

      if (users.length === 1) {
        user = users[0];
        console.log("Found user by email prefix:", user.email);
      } else if (users.length > 1) {
        console.log(
          "Multiple users found with email prefix, using first one:",
          users.map((u) => u.email)
        );
        user = users[0];
      }
    }

    // If found by email, link the cognitoSub
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          cognitoSub: sub,
          isActive: true,
          lastLoginAt: new Date(),
        },
        include: {
          defaultDealer: true,
          dealers: {
            include: {
              dealer: true,
            },
          },
        },
      });
      console.log("Linked existing user to Cognito:", user.email);
    }
  } else {
    // Update last login time
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: {
        defaultDealer: true,
        dealers: {
          include: {
            dealer: true,
          },
        },
      },
    });
  }

  // If still no user found, create a new one (self-service signup)
  if (!user) {
    // Get a default dealer (you might want to implement proper logic here)
    const defaultDealer = await prisma.dealer.findFirst({
      where: { isActive: true },
    });

    if (!defaultDealer) {
      throw new Error("No active dealers found");
    }

    user = await prisma.user.create({
      data: {
        cognitoSub: sub,
        email,
        name: name || email.split("@")[0], // Use name from token or fallback to email prefix
        role: "USER", // Default role for self-service signups
        defaultDealerId: defaultDealer.id,
        isActive: true,
        lastLoginAt: new Date(),
      },
      include: {
        defaultDealer: true,
        dealers: {
          include: {
            dealer: true,
          },
        },
      },
    });

    // Create user-dealer relationship
    await prisma.userDealer.create({
      data: {
        userId: user.id,
        dealerId: defaultDealer.id,
      },
    });

    console.log("Created new user:", user.email);
  }

  // Format response to match expected structure
  // For SUPER_ADMIN and MULTI_DEALER, fetch all active dealers instead of just linked ones
  let dealersList;
  if (user.role === "SUPER_ADMIN" || user.role === "MULTI_DEALER") {
    const allDealers = await prisma.dealer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    dealersList = allDealers.map((dealer) => ({
      id: dealer.id,
      name: dealer.name,
      address: dealer.address,
      phone: dealer.contactPhone,
      city: dealer.city,
      state: dealer.state,
      zip: dealer.zip,
      isActive: dealer.isActive,
    }));
  } else {
    // For regular users, only show dealers they have access to
    dealersList = user.dealers.map((ud) => ({
      id: ud.dealer.id,
      name: ud.dealer.name,
      address: ud.dealer.address,
      phone: ud.dealer.contactPhone,
      city: ud.dealer.city,
      state: ud.dealer.state,
      zip: ud.dealer.zip,
      isActive: ud.dealer.isActive,
    }));
  }

  const userProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    defaultDealerId: user.defaultDealerId,
    isActive: user.isActive,
    dealers: dealersList,
  };

  return userProfile;
}

export async function GET(request: NextRequest) {
  try {
    const userProfile = await getUserFromToken(request);
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch user",
      },
      {
        status:
          error instanceof Error && error.message.includes("authorization")
            ? 401
            : 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userProfile = await getUserFromToken(request);
    const body = await request.json();
    const { defaultDealerId } = body;

    if (!defaultDealerId) {
      return NextResponse.json(
        { error: "defaultDealerId is required" },
        { status: 400 }
      );
    }

    // Verify the dealer exists and user has access to it
    const hasAccess = userProfile.dealers.some((d) => d.id === defaultDealerId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this dealer" },
        { status: 403 }
      );
    }

    // Update the user's default dealer
    const updatedUser = await prisma.user.update({
      where: { id: userProfile.id },
      data: { defaultDealerId },
      include: {
        defaultDealer: true,
        dealers: {
          include: {
            dealer: true,
          },
        },
      },
    });

    // Format response
    let dealersList;
    if (
      updatedUser.role === "SUPER_ADMIN" ||
      updatedUser.role === "MULTI_DEALER"
    ) {
      const allDealers = await prisma.dealer.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });
      dealersList = allDealers.map((dealer) => ({
        id: dealer.id,
        name: dealer.name,
        address: dealer.address,
        phone: dealer.contactPhone,
        city: dealer.city,
        state: dealer.state,
        zip: dealer.zip,
        isActive: dealer.isActive,
      }));
    } else {
      dealersList = updatedUser.dealers.map((ud) => ({
        id: ud.dealer.id,
        name: ud.dealer.name,
        address: ud.dealer.address,
        phone: ud.dealer.contactPhone,
        city: ud.dealer.city,
        state: ud.dealer.state,
        zip: ud.dealer.zip,
        isActive: ud.dealer.isActive,
      }));
    }

    const updatedProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      defaultDealerId: updatedUser.defaultDealerId,
      isActive: updatedUser.isActive,
      dealers: dealersList,
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error in /api/auth/me PATCH:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      {
        status:
          error instanceof Error && error.message.includes("authorization")
            ? 401
            : 500,
      }
    );
  }
}
