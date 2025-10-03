/**
 * Cognito JWT Token Verification
 * 
 * This module verifies JWT tokens issued by AWS Cognito
 */

import { jwtVerify } from 'jose';

interface CognitoTokenPayload {
  sub: string;
  email: string;
  name?: string;
  'cognito:username': string;
  exp: number;
  iat: number;
}

export async function verifyCognitoToken(token: string): Promise<CognitoTokenPayload | null> {
  try {
    // For Cognito tokens, we would normally fetch the JWKS from Cognito and verify
    // For now, we'll do basic JWT parsing without full verification
    // In production, you should implement proper Cognito token verification
    
    // Decode the token (without verification for development)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return payload as CognitoTokenPayload;
  } catch (error) {
    console.error('Cognito token verification failed:', error);
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Extract user email from Cognito token
 */
export async function getUserEmailFromToken(token: string): Promise<string | null> {
  const payload = await verifyCognitoToken(token);
  return payload?.email || null;
}
