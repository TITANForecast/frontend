import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { UserInput } from '@/lib/types/admin';
import { createCognitoUser, checkCognitoUserExists } from '@/lib/cognito/admin-service';

/**
 * GET /api/admin/users
 * Retrieve all users
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const users = await prismaDb.users.findAll();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user with Cognito integration
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body: UserInput & { 
      linkExisting?: boolean; // Flag from frontend
      skipCognitoCreation?: boolean; // For testing/special cases
    } = await request.json();

    // Validation
    if (!body.email || !body.name || !body.role || !body.defaultDealerId) {
      return NextResponse.json(
        { error: 'Missing required user fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let cognitoSub: string | null = null;
    let cognitoStatus: string = 'PENDING';
    let invitationSent: boolean = false;

    // STEP 1: Check if user exists in Cognito
    const existingCheck = await checkCognitoUserExists(body.email);

    if (existingCheck.exists && existingCheck.user) {
      // User already exists in Cognito
      if (body.linkExisting) {
        // Link to existing Cognito account
        cognitoSub = existingCheck.user.cognitoSub;
        cognitoStatus = existingCheck.user.status;
        console.log(`Linking to existing Cognito user: ${body.email}`);
      } else if (body.skipCognitoCreation) {
        // Create DB record only (for testing)
        cognitoSub = null;
        cognitoStatus = 'DB_ONLY';
        console.log(`Creating DB-only user: ${body.email}`);
      } else {
        // This shouldn't happen if frontend checks first
        return NextResponse.json(
          { 
            error: 'User already exists in Cognito',
            existingUser: existingCheck.user,
            requiresDecision: true,
          },
          { status: 409 }
        );
      }
    } else {
      // User doesn't exist - create in Cognito
      if (!body.skipCognitoCreation) {
        // Require password for Cognito user creation
        if (!body.password) {
          return NextResponse.json(
            { error: 'Password is required to create a Cognito user' },
            { status: 400 }
          );
        }

        const cognitoResult = await createCognitoUser(body.email, body.name, body.password);
        
        if (!cognitoResult.success) {
          return NextResponse.json(
            { error: `Failed to create Cognito user: ${cognitoResult.error}` },
            { status: 500 }
          );
        }

        cognitoSub = cognitoResult.cognitoSub!;
        cognitoStatus = 'CONFIRMED'; // Password is permanent, no reset required
        invitationSent = false; // No email sent, admin will share credentials
      }
    }

    // STEP 2: Create user in database
    const userData = {
      email: body.email,
      name: body.name,
      role: body.role,
      defaultDealerId: body.defaultDealerId,
      isActive: body.isActive ?? true,
      cognitoSub,
      invitedAt: invitationSent ? new Date() : undefined,
      invitedBy: invitationSent && auth.user ? auth.user.id : undefined,
      cognitoStatus,
    };

    const newUser = await prismaDb.users.create(userData);

    // STEP 3: Set up dealer associations
    if (body.dealerIds && body.dealerIds.length > 0) {
      await prismaDb.userDealers.setUserDealers(newUser.id, body.dealerIds);
    } else {
      await prismaDb.userDealers.addUserDealer(newUser.id, body.defaultDealerId);
    }

    // Fetch complete user with dealers
    const completeUser = await prismaDb.users.findById(newUser.id);

    // Determine response message
    let message = 'User created successfully.';
    if (invitationSent) {
      message += ' Invitation email sent.';
    } else if (body.linkExisting) {
      message += ' Linked to existing Cognito account. User can login immediately.';
    } else if (body.skipCognitoCreation) {
      message += ' Database record only (no Cognito account).';
    }

    return NextResponse.json({
      ...completeUser,
      message,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

