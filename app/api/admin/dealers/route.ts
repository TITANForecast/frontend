import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { DealerInput } from '@/lib/types/admin';

/**
 * GET /api/admin/dealers
 * Retrieve all dealers
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const dealers = await prismaDb.dealers.findAll();
    return NextResponse.json(dealers);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dealers
 * Create a new dealer
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body: DealerInput = await request.json();

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Dealer name is required' },
        { status: 400 }
      );
    }

    const dealerData = {
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      isActive: body.isActive ?? true,
    };

    const newDealer = await prismaDb.dealers.create(dealerData);
    return NextResponse.json(newDealer, { status: 201 });
  } catch (error) {
    console.error('Error creating dealer:', error);
    return NextResponse.json(
      { error: 'Failed to create dealer' },
      { status: 500 }
    );
  }
}

