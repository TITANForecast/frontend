import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { createCognitoUser, checkCognitoUserExists } from '@/lib/cognito/admin-service';

/**
 * POST /api/admin/users/[id]/link-cognito
 * Link an existing database user to a new Cognito identity
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
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Get the user from database
    const user = await prismaDb.users.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has Cognito identity
    if (user.cognitoSub) {
      return NextResponse.json(
        { error: 'User already has a Cognito identity' },
        { status: 400 }
      );
    }

    // Check if Cognito user already exists with this email
    const existingCognito = await checkCognitoUserExists(user.email);
    if (existingCognito.exists && existingCognito.user) {
      // Link to existing Cognito user
      const updatedUser = await prismaDb.users.update(id, {
        cognitoSub: existingCognito.user.cognitoSub,
        cognitoStatus: existingCognito.user.status,
      });

      return NextResponse.json({
        success: true,
        message: 'Linked to existing Cognito user',
        user: updatedUser,
      });
    }

    // Create new Cognito user
    const result = await createCognitoUser(user.email, user.name, password);
    
    if (!result.success || !result.cognitoSub) {
      return NextResponse.json(
        { error: `Failed to create Cognito user: ${result.error}` },
        { status: 500 }
      );
    }

    // Update user in database with Cognito details
    const updatedUser = await prismaDb.users.update(id, {
      cognitoSub: result.cognitoSub,
      cognitoStatus: 'CONFIRMED', // User can log in immediately with the password we set
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully created Cognito user and linked to database user',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error linking user to Cognito:', error);
    return NextResponse.json(
      { error: 'Failed to link user to Cognito' },
      { status: 500 }
    );
  }
}

