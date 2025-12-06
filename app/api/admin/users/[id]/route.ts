import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { UserInput } from '@/lib/types/admin';
import { 
  updateCognitoUser, 
  deleteCognitoUser, 
  disableCognitoUser, 
  enableCognitoUser,
  setCognitoUserPassword,
} from '@/lib/cognito/admin-service';

/**
 * GET /api/admin/users/[id]
 * Retrieve a specific user
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
    const user = await prismaDb.users.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user (syncs with Cognito)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body: Partial<UserInput> = await request.json();

    // Get current user to check if they have a Cognito account
    const currentUser = await prismaDb.users.findById(id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user basic info
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.defaultDealerId) updateData.defaultDealerId = body.defaultDealerId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Sync with Cognito if user has a Cognito account
    if (currentUser.cognitoSub) {
      // Update name in Cognito if changed
      if (body.name && body.name !== currentUser.name) {
        await updateCognitoUser(currentUser.email, { name: body.name });
      }

      // Update password in Cognito if provided
      if (body.password) {
        const passwordResult = await setCognitoUserPassword(currentUser.email, body.password);
        if (!passwordResult.success) {
          return NextResponse.json(
            { error: `Failed to update password in Cognito: ${passwordResult.error}` },
            { status: 500 }
          );
        }
      }

      // Handle isActive change - disable/enable in Cognito
      if (body.isActive !== undefined && body.isActive !== currentUser.isActive) {
        if (body.isActive) {
          await enableCognitoUser(currentUser.email);
        } else {
          await disableCognitoUser(currentUser.email);
        }
      }
    }

    const updatedUser = await prismaDb.users.update(id, updateData);

    // Update dealer associations if provided
    if (body.dealerIds !== undefined) {
      await prismaDb.userDealers.setUserDealers(id, body.dealerIds);
    }

    // Fetch complete user with dealers
    const completeUser = await prismaDb.users.findById(id);

    return NextResponse.json(completeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (soft delete in Cognito, hard delete in DB)
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

    // Get user before deleting to access email and cognitoSub
    const user = await prismaDb.users.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete from Cognito if user has a Cognito account
    if (user.cognitoSub) {
      const cognitoResult = await deleteCognitoUser(user.email);
      if (!cognitoResult.success && cognitoResult.error) {
        console.error(`Failed to delete Cognito user ${user.email}:`, cognitoResult.error);
        // Continue with DB deletion even if Cognito deletion fails
      }
    }

    // Delete from database
    const success = await prismaDb.users.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedFromCognito: !!user.cognitoSub,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

