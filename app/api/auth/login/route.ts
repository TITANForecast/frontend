import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/mock-db';
import { signToken } from '@/lib/auth/jwt';
import { LoginRequest, LoginResponse, SessionData, UserProfile } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json<LoginResponse>(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.users.findByEmail(email);
    
    if (!user || !user.isActive) {
      return NextResponse.json<LoginResponse>(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json<LoginResponse>(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user's dealers
    const userDealers = await db.userDealers.getUserDealers(user.id);
    
    if (userDealers.length === 0) {
      return NextResponse.json<LoginResponse>(
        { success: false, message: 'No dealer assigned to this user' },
        { status: 403 }
      );
    }

    // Create session data
    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      currentDealerId: user.defaultDealerId,
      defaultDealerId: user.defaultDealerId,
    };

    // Sign JWT token
    const token = await signToken(sessionData);

    // Create user profile (without password)
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      defaultDealerId: user.defaultDealerId,
      role: user.role,
      dealers: userDealers,
      isActive: user.isActive,
    };

    // Return success response
    return NextResponse.json<LoginResponse>(
      {
        success: true,
        token,
        user: userProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<LoginResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
