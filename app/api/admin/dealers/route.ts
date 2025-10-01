import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyCognitoToken } from '@/lib/auth/cognito-jwt';
import { db } from '@/lib/db/mock-db';
import { UserRole } from '@/lib/types/auth';

// GET all dealers (Super Admin only)
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

    // Get all dealers
    const dealers = await db.dealers.findAll();

    return NextResponse.json(
      {
        success: true,
        dealers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get dealers error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new dealer (Super Admin only)
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
    const { name, address, phone, city, state, zip } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Dealer name is required' },
        { status: 400 }
      );
    }

    // Create dealer
    const newDealer = await db.dealers.create({
      name,
      address: address || '',
      phone: phone || '',
      city: city || '',
      state: state || '',
      zip: zip || '',
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        dealer: newDealer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create dealer error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
