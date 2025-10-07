/**
 * API Route for RO Parser
 * POST /api/ro-parser - Parse DMS RO records
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseRORecord, parseROBatch, logParserResult, logBatchResults } from '@/lib/parsers/ro-parser';
import { RawRORecord } from '@/lib/parsers/ro-parser-types';

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const isBatch = Array.isArray(body.records);
    
    if (isBatch) {
      const records: RawRORecord[] = body.records;
      
      if (!records || records.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No records provided' },
          { status: 400 }
        );
      }

      console.log(`\n🔄 Processing batch of ${records.length} RO records...`);
      
      const batchResult = parseROBatch(records);
      logBatchResults(batchResult);

      return NextResponse.json({
        success: true,
        batchResult,
      });
    } else {
      const record: RawRORecord = body.record || body;
      
      if (!record || typeof record !== 'object') {
        return NextResponse.json(
          { success: false, error: 'Invalid record format' },
          { status: 400 }
        );
      }

      console.log(`\n🔄 Processing single RO record...`);
      
      const result = parseRORecord(record);
      logParserResult(result);

      return NextResponse.json({
        success: result.success,
        data: result.data,
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  } catch (error) {
    console.error('Error in RO parser API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'RO Parser API',
    version: '1.0.0',
    description: 'Multi-tenant DMS Repair Order parser with delimiter handling',
    endpoints: {
      POST: {
        path: '/api/ro-parser',
        description: 'Parse RO records (single or batch)',
        body: {
          single: { record: 'RawRORecord object' },
          batch: { records: 'Array of RawRORecord objects' }
        }
      }
    },
    features: [
      'Multi-tenant aware parsing',
      'Operation code delimiter handling (|)',
      'Intra-operation delimiter handling (^)',
      'Parts and labor mapping to operations',
      'Comprehensive validation and error handling',
      'Batch processing support',
    ]
  });
}
