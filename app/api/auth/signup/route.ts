import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db/mock-db';
import { SignupRequest, SignupResponse, UserRole } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json<SignupResponse>(
        { success: false, message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json<SignupResponse>(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await db.users.create({
      email,
      passwordHash,
      name,
      role: UserRole.USER, // Default role
      isActive: true,
      defaultDealerId: '', // Will be set when dealer is assigned
    });

    // Return success response
    return NextResponse.json<SignupResponse>(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json<SignupResponse>(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
