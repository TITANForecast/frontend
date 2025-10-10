import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { mockDb } from '@/lib/db/mock-admin-data';

/**
 * GET /api/admin/stats
 * Retrieve admin statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const stats = await mockDb.stats.getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

