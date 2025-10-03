import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyCognitoToken, getUserEmailFromToken } from '@/lib/auth/cognito-jwt';
import { db } from '@/lib/db/mock-db';
import { UserProfile } from '@/lib/types/auth';

export async function GET(request: NextRequest) {
  try {
    // Get and verify Cognito token
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

    // Find user in our database by email
    const user = await db.users.findByEmail(cognitoPayload.email);
    
    if (!user || !user.isActive) {
      // User authenticated in Cognito but not in our system
      // Return basic Cognito user info
      return NextResponse.json(
        { 
          success: true, 
          user: null,
          cognitoUser: {
            email: cognitoPayload.email,
            name: cognitoPayload.name,
          },
          message: 'User not found in system' 
        },
        { status: 200 }
      );
    }

    // Get user's dealers
    const userDealers = await db.userDealers.getUserDealers(user.id);

    // Create user profile
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      defaultDealerId: user.defaultDealerId,
      role: user.role,
      dealers: userDealers,
      isActive: user.isActive,
    };

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
        session: {
          currentDealerId: user.defaultDealerId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
