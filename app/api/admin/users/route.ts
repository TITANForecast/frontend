import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getTokenFromRequest, verifyCognitoToken } from '@/lib/auth/cognito-jwt';
import { db } from '@/lib/db/mock-db';
import { UserRole } from '@/lib/types/auth';

// GET all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const cognitoPayload = await verifyCognitoToken(token);
    
    if (!cognitoPayload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user by email and check role
    const user = await db.users.findByEmail(cognitoPayload.email);
    
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all users
    const users = await db.users.findAll();
    
    // Get dealers for each user
    const usersWithDealers = await Promise.all(
      users.map(async (user) => {
        const dealers = await db.userDealers.getUserDealers(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          defaultDealerId: user.defaultDealerId,
          dealers,
          isActive: user.isActive,
          createdAt: user.createdAt,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        users: usersWithDealers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and authorization
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const cognitoPayload = await verifyCognitoToken(token);
    
    if (!cognitoPayload) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user by email and check role
    const adminUser = await db.users.findByEmail(cognitoPayload.email);
    
    if (!adminUser || adminUser.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get request data
    const body = await request.json();
    const { email, name, password, role, defaultDealerId, dealerIds } = body;

    // Validate required fields
    if (!email || !name || !password || !role || !defaultDealerId || !dealerIds || dealerIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate default dealer is in dealer list
    if (!dealerIds.includes(defaultDealerId)) {
      return NextResponse.json(
        { success: false, message: 'Default dealer must be in the dealer list' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.users.create({
      email,
      name,
      passwordHash,
      role,
      defaultDealerId,
      isActive: true,
    });

    // Assign dealers to user
    for (const dealerId of dealerIds) {
      await db.userDealers.create({
        userId: newUser.id,
        dealerId,
      });
    }

    // Get user's dealers
    const dealers = await db.userDealers.getUserDealers(newUser.id);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          defaultDealerId: newUser.defaultDealerId,
          dealers,
          isActive: newUser.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
