import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { mockDb } from '@/lib/db/mock-admin-data';

/**
 * GET /api/admin/sync-status
 * Retrieve sync status for all dealers
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const syncStatus = await mockDb.stats.getSyncStatus();
    return NextResponse.json(syncStatus);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

