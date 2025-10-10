import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { mockDb } from '@/lib/db/mock-admin-data';
import { UserInput } from '@/lib/types/admin';

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

    const users = await mockDb.users.findAll();
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
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body: UserInput = await request.json();

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

    const userData = {
      email: body.email,
      name: body.name,
      role: body.role,
      defaultDealerId: body.defaultDealerId,
      isActive: body.isActive ?? true,
    };

    const newUser = await mockDb.users.create(userData);

    // Set up dealer associations
    if (body.dealerIds && body.dealerIds.length > 0) {
      await mockDb.userDealers.setUserDealers(newUser.id, body.dealerIds);
    } else {
      // If no dealers specified, add default dealer
      await mockDb.userDealers.addUserDealer(newUser.id, body.defaultDealerId);
    }

    // Fetch complete user with dealers
    const completeUser = await mockDb.users.findById(newUser.id);

    // TODO: In production, create user in Cognito and send invitation email
    // await createCognitoUser(body.email, body.password);

    return NextResponse.json(completeUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

