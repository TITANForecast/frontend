import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    // Mock user data for development
    const user = {
      id: 'user-1',
      email: 'admin@titan.com',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      defaultDealerId: 'dealer-1',
      isActive: true,
      dealers: [
        {
          id: 'dealer-1',
          name: 'Titan Motors',
          address: '123 Main St',
          phone: '555-0123',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
          isActive: true
        }
      ]
    };

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
