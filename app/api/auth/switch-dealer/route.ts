import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const { dealerId } = await request.json();
    
    // Mock dealer switching logic
    const user = {
      id: 'user-1',
      email: 'admin@titan.com',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      defaultDealerId: dealerId,
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
        },
        {
          id: 'dealer-2',
          name: 'Auto World',
          address: '456 Oak Ave',
          phone: '555-0456',
          city: 'Somewhere',
          state: 'CA',
          zip: '67890',
          isActive: true
        }
      ]
    };

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to switch dealer' },
      { status: 500 }
    );
  }
}
