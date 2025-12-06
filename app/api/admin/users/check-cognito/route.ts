import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { checkCognitoUserExists } from '@/lib/cognito/admin-service';

/**
 * POST /api/admin/users/check-cognito
 * Check if a user exists in Cognito before creating
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists in Cognito
    const result = await checkCognitoUserExists(email);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: result.exists,
      user: result.user,
    });
  } catch (error) {
    console.error('Error checking Cognito user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}


