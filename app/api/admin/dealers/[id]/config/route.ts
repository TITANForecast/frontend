import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, unauthorizedResponse } from '@/lib/auth/middleware';
import { prismaDb } from '@/lib/db/prisma-admin-data';
import { DealerApiConfigInput } from '@/lib/types/admin';

/**
 * GET /api/admin/dealers/[id]/config
 * Retrieve API config for a dealer
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
    const config = await prismaDb.apiConfigs.findByDealerId(id);

    if (!config) {
      return NextResponse.json(
        { error: 'API config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching API config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API config' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dealers/[id]/config
 * Create or update API config for a dealer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body: DealerApiConfigInput = await request.json();

    // Validation
    if (!body.dealerShortCode || !body.programId || !body.subscriptionKey || !body.xUserEmail) {
      return NextResponse.json(
        { error: 'Missing required API config fields' },
        { status: 400 }
      );
    }

    // Check if dealer exists
    const dealer = await prismaDb.dealers.findById(id);
    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      );
    }

    // Check if config already exists
    const existingConfig = await prismaDb.apiConfigs.findByDealerId(id);

    const configData = {
      dealerId: id,
      dealerShortCode: body.dealerShortCode,
      programId: body.programId,
      subscriptionKey: body.subscriptionKey, // TODO: Encrypt in production
      xUserEmail: body.xUserEmail,
      deliveryEndpoint: body.deliveryEndpoint || 'https://authenticom.azure-api.net/dv-delivery/v1/delivery',
      jwtTokenUrl: body.jwtTokenUrl || 'https://authenticom.azure-api.net/dv-delivery/v1/token',
      fileTypeCode: body.fileTypeCode || 'SV',
      compareDateDefault: body.compareDateDefault ?? 1,
      lastSuccess: null,
      lastError: null,
      isActive: body.isActive ?? true,
    };

    let result;
    if (existingConfig) {
      result = await prismaDb.apiConfigs.update(existingConfig.id, configData);
    } else {
      result = await prismaDb.apiConfigs.create(configData);
    }

    return NextResponse.json(result, { status: existingConfig ? 200 : 201 });
  } catch (error) {
    console.error('Error creating/updating API config:', error);
    return NextResponse.json(
      { error: 'Failed to save API config' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/dealers/[id]/config
 * Delete API config for a dealer
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
    const config = await prismaDb.apiConfigs.findByDealerId(id);

    if (!config) {
      return NextResponse.json(
        { error: 'API config not found' },
        { status: 404 }
      );
    }

    await prismaDb.apiConfigs.delete(config.id);
    return NextResponse.json({ message: 'API config deleted successfully' });
  } catch (error) {
    console.error('Error deleting API config:', error);
    return NextResponse.json(
      { error: 'Failed to delete API config' },
      { status: 500 }
    );
  }
}

