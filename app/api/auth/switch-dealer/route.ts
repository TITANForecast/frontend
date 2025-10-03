import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyCognitoToken } from '@/lib/auth/cognito-jwt';
import { db } from '@/lib/db/mock-db';
import { SwitchDealerRequest, SwitchDealerResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Get and verify Cognito token
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const cognitoPayload = await verifyCognitoToken(token);
    
    if (!cognitoPayload) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await db.users.findByEmail(cognitoPayload.email);
    
    if (!user) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'User not found in system' },
        { status: 404 }
      );
    }

    // Get dealer to switch to
    const body: SwitchDealerRequest = await request.json();
    const { dealerId } = body;

    if (!dealerId) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this dealer
    const userDealers = await db.userDealers.findByUserId(user.id);
    const hasAccess = userDealers.some(ud => ud.dealerId === dealerId);

    if (!hasAccess) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'Access denied to this dealer' },
        { status: 403 }
      );
    }

    // Verify dealer exists and is active
    const dealer = await db.dealers.findById(dealerId);
    
    if (!dealer || !dealer.isActive) {
      return NextResponse.json<SwitchDealerResponse>(
        { success: false, message: 'Dealer not found or inactive' },
        { status: 404 }
      );
    }

    // For Cognito, we don't issue new tokens - the client keeps using the Cognito token
    // We just validate and confirm the switch is allowed
    return NextResponse.json<SwitchDealerResponse>(
      {
        success: true,
        message: 'Dealer switched successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Switch dealer error:', error);
    return NextResponse.json<SwitchDealerResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
