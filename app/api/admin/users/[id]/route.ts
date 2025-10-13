import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { mockDb } from '@/lib/db/mock-admin-data';
import { UserInput } from '@/lib/types/admin';

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
    const user = await mockDb.users.findById(id);

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
 * Update a user
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

    // Update user basic info
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.defaultDealerId) updateData.defaultDealerId = body.defaultDealerId;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedUser = await mockDb.users.update(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update dealer associations if provided
    if (body.dealerIds !== undefined) {
      await mockDb.userDealers.setUserDealers(id, body.dealerIds);
    }

    // Fetch complete user with dealers
    const completeUser = await mockDb.users.findById(id);

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
 * Delete a user
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
    const success = await mockDb.users.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // TODO: In production, also delete from Cognito
    // await deleteCognitoUser(email);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

