import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { mockDb } from '@/lib/db/mock-admin-data';
import { DealerInput } from '@/lib/types/admin';

/**
 * GET /api/admin/dealers/[id]
 * Retrieve a specific dealer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const dealer = await mockDb.dealers.findById(id);

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(dealer);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/dealers/[id]
 * Update a dealer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body: Partial<DealerInput> = await request.json();

    const updatedDealer = await mockDb.dealers.update(id, body);

    if (!updatedDealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedDealer);
  } catch (error) {
    console.error('Error updating dealer:', error);
    return NextResponse.json(
      { error: 'Failed to update dealer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/dealers/[id]
 * Delete a dealer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const success = await mockDb.dealers.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json(
      { error: 'Failed to delete dealer' },
      { status: 500 }
    );
  }
}

