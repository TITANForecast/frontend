import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/types/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware to verify SUPER_ADMIN role
 * This is a mock implementation for development
 * In production, this should verify JWT tokens from Cognito
 */
export async function requireSuperAdmin(request: NextRequest) {
  try {
    // In development mode, allow all requests with mock user
    if (process.env.NODE_ENV === 'development') {
      return {
        authorized: true,
        user: {
          id: 'dev-user-1',
          email: 'dev@titan.com',
          role: UserRole.SUPER_ADMIN,
        },
      };
    }

    // Production: Verify Cognito JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7);
    
    // TODO: Implement actual Cognito JWT verification
    // For now, mock the verification
    // const decodedToken = await verifyToken(token);
    // const userRole = decodedToken['custom:role'];
    
    // Mock user for testing
    const mockUser = {
      id: 'cognito-user-id',
      email: 'admin@titan.com',
      role: UserRole.SUPER_ADMIN,
    };

    if (mockUser.role !== UserRole.SUPER_ADMIN) {
      return { authorized: false, error: 'Insufficient permissions' };
    }

    return { authorized: true, user: mockUser };
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

