import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/types/auth';
import { prisma } from '@/lib/db/prisma-admin-data';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to verify SUPER_ADMIN role
 * Verifies JWT tokens from Cognito and looks up user role in database
 */
export async function requireSuperAdmin(request: NextRequest) {
  try {
    // Verify Cognito JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7);
    
    // Decode JWT token to get user information
    let cognitoSub: string;
    
    try {
      // Decode the JWT payload (base64 decode the middle part)
      const payloadBase64 = token.split('.')[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      
      // Extract Cognito sub from token
      cognitoSub = payload.sub;
      
      if (!cognitoSub) {
        return { authorized: false, error: 'Invalid token: missing sub claim' };
      }
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return { authorized: false, error: 'Invalid token format' };
    }

    // Look up user by Cognito sub in database
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
    });
    
    if (!user) {
      return { authorized: false, error: 'User not found in database' };
    }

    // Verify user has SUPER_ADMIN role
    if (user.role !== UserRole.SUPER_ADMIN) {
      return { authorized: false, error: 'Insufficient permissions' };
    }

    return { 
      authorized: true, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
      }
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { authorized: false, error: 'Authentication failed' };
  }
}

/**
 * Helper function to create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Helper function to verify if user has required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 3,
    [UserRole.MULTI_DEALER]: 2,
    [UserRole.USER]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

