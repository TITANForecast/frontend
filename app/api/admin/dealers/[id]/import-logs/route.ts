import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb, prisma } from '@/lib/db/prisma-admin-data';
import { ImportLog } from '@/lib/types/admin';

/**
 * GET /api/admin/dealers/[id]/import-logs
 * Retrieve import logs for a dealer with optional filters
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
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const fileType = searchParams.get('fileType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const daysBack = parseInt(searchParams.get('daysBack') || '14');

    // Verify dealer exists
    const dealer = await prismaDb.dealers.findById(id);
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    // Build where clause - use dealer ID string directly
    const where: any = {
      dealerId: id,
      createdAt: {
        gte: dateThreshold,
      },
    };

    if (fileType) {
      where.fileType = fileType;
    }

    if (status) {
      where.status = status;
    }

    // Fetch logs from import_log table
    const logs = await prisma.importLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Convert BigInt to string for JSON serialization
    const serializedLogs: ImportLog[] = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      dealerId: log.dealerId.toString(),
      elapsedSeconds: log.elapsedSeconds ? Number(log.elapsedSeconds) : null,
    }));

    return NextResponse.json(serializedLogs);
  } catch (error) {
    console.error('Error fetching import logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import logs' },
      { status: 500 }
    );
  }
}

