/**
 * DMS Repair Order (RO) Parser Utility
 * Handles multi-tenant RO data with | and ^ delimiters
 * Maps parts and labor to operations using line mapping fields
 */

import {
  RawRORecord,
  ParsedROData,
  ParsedROHeader,
  ParsedOperation,
  ParsedLaborEntry,
  ParsedPartEntry,
  ParserResult,
  ParserValidationError,
  VehicleInfo,
  CustomerInfo,
  BatchParserResult,
} from './ro-parser-types';

/**
 * Parse a monetary string value to number
 * Handles formats like "6,929.96" or empty strings
 */
function parseMonetary(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a numeric string to number
 */
function parseNumeric(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseFloat(value.trim());
  return isNaN(num) ? 0 : num;
}

/**
 * Parse an integer string to number
 */
function parseInteger(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Split a field by operation delimiter |
 * Returns array of values, one per operation
 */
function splitByOperations(value: string): string[] {
  if (!value || value.trim() === '') return [];
  return value.split('|');
}

/**
 * Split a field by intra-operation delimiter ^
 * Returns array of values within a single operation
 */
function splitWithinOperation(value: string): string[] {
  if (!value || value.trim() === '') return [];
  return value.split('^');
}

/**
 * Validate and extract tenant ID from raw record
 */
function extractTenantId(record: RawRORecord, errors: ParserValidationError[]): string {
  const dvDealerId = record['DV Dealer ID']?.trim();
  const vendorDealerId = record['Vendor Dealer ID']?.trim();

  if (!dvDealerId && !vendorDealerId) {
    errors.push({
      type: 'missing_tenant',
      field: 'DV Dealer ID / Vendor Dealer ID',
      message: 'No tenant/dealer ID found in record',
    });
    return '';
  }

  // Prefer DV Dealer ID, fallback to Vendor Dealer ID
  return dvDealerId || vendorDealerId;
}

/**
 * Parse RO header information
 */
function parseROHeader(record: RawRORecord, tenantId: string): ParsedROHeader {
  const vehicle: VehicleInfo = {
    vin: record['VIN'] || '',
    year: record['Year'] || '',
    make: record['Make'] || '',
    model: record['Model'] || '',
    modelNumber: record['Model Number'] || '',
    roMileage: parseInteger(record['RO Mileage']),
    mileageOut: parseInteger(record['Mileage Out']),
    description: record['Description'] || '',
    transmission: record['Transmission'] || '',
    vinExplosionYear: record['VIN Explosion Year'] || '',
    vinExplosionMake: record['VIN Explosion Make'] || '',
    vinExplosionModel: record['VIN Explosion Model'] || '',
    vinExplosionTrim: record['VIN Explosion Trim'] || '',
    vinExplosionFuelType: record['VIN Explosion Fuel Type'] || '',
    vinExplosionEngineSize: record['VIN Explosion Engine Size'] || '',
  };

  const customer: CustomerInfo = {
    customerNumber: record['Customer Number'] || '',
    fullName: record['Full Name'] || '',
    firstName: record['First Name'] || '',
    middleName: record['Middle Name'] || '',
    lastName: record['Last Name'] || '',
    suffix: record['Suffix'] || '',
    addressLine1: record['Address Line 1'] || '',
    addressLine2: record['Address Line 2'] || '',
    city: record['City'] || '',
    state: record['State'] || '',
    zipCode: record['Zip Code'] || '',
    county: record['County'] || '',
    homePhone: record['Home Phone'] || '',
    cellPhone: record['Cell Phone'] || '',
    workPhone: record['Work Phone'] || '',
    workPhoneExtension: record['Work Phone Extension'] || '',
    email1: record['Email 1'] || '',
    email2: record['Email 2'] || '',
    email3: record['Email 3'] || '',
    birthDate: record['Birth Date'] || '',
    individualBusinessFlag: record['Individual/Business Flag'] || '',
    customerCreateDate: record['Customer Create Date'] || '',
    customerLastActivityDate: record['Customer Last Activity Date'] || '',
  };

  return {
    tenantId,
    dvDealerId: record['DV Dealer ID'] || '',
    vendorDealerId: record['Vendor Dealer ID'] || '',
    dmsType: record['DMS Type'] || '',
    roNumber: record['RO Number'] || '',
    openDate: record['Open Date'] || '',
    closeDate: record['Close Date'] || '',
    serviceAdvisorNumber: record['Service Advisor Number'] || '',
    serviceAdvisorName: record['Service Advisor Name'] || '',
    roDepartment: record['RO Department'] || '',
    roStore: record['RO Store'] || '',
    appointmentDate: record['Appointment Date'] || '',
    appointmentFlag: record['Appointment Flag'] || '',
    appointmentNumber: record['Appointment Number'] || '',
    roStatus: record['RO Status'] || '',
    tagNumber: record['Tag Number'] || '',
    totalCost: parseMonetary(record['Total Cost']),
    totalSale: parseMonetary(record['Total Sale']),
    customerTotalCost: parseMonetary(record['Customer Total Cost']),
    customerTotalSale: parseMonetary(record['Customer Total Sale']),
    warrantyTotalCost: parseMonetary(record['Warranty Total Cost']),
    warrantyTotalSale: parseMonetary(record['Warranty Total Sale']),
    internalTotalCost: parseMonetary(record['Internal Total Cost']),
    internalTotalSale: parseMonetary(record['Internal Total Sale']),
    totalLaborCost: parseMonetary(record['Total Labor Cost']),
    totalLaborSale: parseMonetary(record['Total Labor Sale']),
    totalPartsCost: parseMonetary(record['Total Parts Cost']),
    totalPartsSale: parseMonetary(record['Total Parts Sale']),
    totalSubletCost: parseMonetary(record['Total Sublet Cost']),
    totalSubletSale: parseMonetary(record['Total Sublet Sale']),
    totalTax: parseMonetary(record['Total Tax']),
    vehicle,
    customer,
  };
}

/**
 * Parse operation lines from delimited fields
 */
function parseOperations(
  record: RawRORecord,
  tenantId: string,
  roNumber: string,
  errors: ParserValidationError[]
): ParsedOperation[] {
  const operations: ParsedOperation[] = [];

  const operationCodes = splitByOperations(record['Operation Codes']);
  const operationDescriptions = splitByOperations(record['Operation Code Descriptions']);
  const operationLineNumbers = splitByOperations(record['Operation Line Number']);
  const operationSaleTypes = splitByOperations(record['Operation Sale Types']);
  const operationLineCosts = splitByOperations(record['Operation Line Cost']);
  const operationLineSales = splitByOperations(record['Operation Line Sale']);
  const laborCosts = splitByOperations(record['Labor Cost']);
  const laborSales = splitByOperations(record['Labor Sale']);
  const laborBillHours = splitByOperations(record['Labor Bill Hours']);
  const laborBillRates = splitByOperations(record['Labor Bill Rate']);
  const subletCosts = splitByOperations(record['Sublet Cost']);
  const subletSales = splitByOperations(record['Sublet Sale']);
  const upsells = splitByOperations(record['Upsell']);
  const laborCauses = splitByOperations(record['Labor Cause']);
  const laborComplaints = splitByOperations(record['Labor Complaint']);
  const laborCorrections = splitByOperations(record['Labor Correction']);
  const techLaborLines = splitByOperations(record['Tech Labor Line']);

  const opCount = operationCodes.length;

  if (opCount === 0) {
    errors.push({
      type: 'empty_field',
      field: 'Operation Codes',
      message: 'No operation codes found in record',
    });
    return operations;
  }

  for (let i = 0; i < opCount; i++) {
    const operationLineNumber = parseInteger(operationLineNumbers[i] || String(i + 1));

    operations.push({
      tenantId,
      roNumber,
      operationLineNumber,
      operationCode: operationCodes[i] || '',
      operationCodeDescription: operationDescriptions[i] || '',
      saleType: operationSaleTypes[i] || '',
      operationLineCost: parseMonetary(operationLineCosts[i] || '0'),
      operationLineSale: parseMonetary(operationLineSales[i] || '0'),
      laborCost: parseMonetary(laborCosts[i] || '0'),
      laborSale: parseMonetary(laborSales[i] || '0'),
      laborBillHours: parseNumeric(laborBillHours[i] || '0'),
      laborBillRate: parseMonetary(laborBillRates[i] || '0'),
      subletCost: parseMonetary(subletCosts[i] || '0'),
      subletSale: parseMonetary(subletSales[i] || '0'),
      upsell: upsells[i] || '',
      laborCause: laborCauses[i] || '',
      laborComplaint: laborComplaints[i] || '',
      laborCorrection: laborCorrections[i] || '',
      laborComments: record['Labor Comments'] || '',
      techLaborLine: parseInteger(techLaborLines[i] || String(i + 1)),
    });
  }

  return operations;
}

/**
 * Parse labor entries with tech assignments
 * Labor entries can have multiple techs per operation (^ delimited)
 */
function parseLaborEntries(
  record: RawRORecord,
  tenantId: string,
  roNumber: string,
  operations: ParsedOperation[],
  errors: ParserValidationError[]
): ParsedLaborEntry[] {
  const laborEntries: ParsedLaborEntry[] = [];

  const techNumbers = splitByOperations(record['Tech Number']);
  const techNames = splitByOperations(record['Tech Name']);
  const laborTechHours = splitByOperations(record['Labor Tech Hours']);
  const laborTechRates = splitByOperations(record['Labor Tech Rate']);

  operations.forEach((op, opIndex) => {
    const operationLineNumber = op.operationLineNumber;

    // Get tech data for this operation
    const techNumbersForOp = splitWithinOperation(techNumbers[opIndex] || '');
    const techNamesForOp = splitWithinOperation(techNames[opIndex] || '');
    const hoursForOp = splitWithinOperation(laborTechHours[opIndex] || '');
    const ratesForOp = splitWithinOperation(laborTechRates[opIndex] || '');

    // Create labor entry for each tech
    techNumbersForOp.forEach((techNum, techIndex) => {
      if (techNum && techNum.trim() !== '') {
        laborEntries.push({
          tenantId,
          roNumber,
          operationLineNumber,
          laborLineNumber: techIndex + 1,
          techNumber: techNum.trim(),
          techName: (techNamesForOp[techIndex] || '').trim(),
          techHours: parseNumeric(hoursForOp[techIndex] || '0'),
          techRate: parseMonetary(ratesForOp[techIndex] || '0'),
        });
      }
    });
  });

  return laborEntries;
}

/**
 * Parse part entries using mapping fields
 * Parts are mapped to operations via "Parts Labor Line Number" field
 */
function parsePartEntries(
  record: RawRORecord,
  tenantId: string,
  roNumber: string,
  operations: ParsedOperation[],
  errors: ParserValidationError[]
): ParsedPartEntry[] {
  const partEntries: ParsedPartEntry[] = [];

  // Get mapping field - tells us which operation each part belongs to
  const partsLaborLineNumbers = splitByOperations(record['Parts Labor Line Number']);
  const partsLineNumbers = splitByOperations(record['Parts Line Number']);

  // Get part-level fields (| delimited for operations, ^ for parts within operation)
  const partsSaleTypes = splitByOperations(record['Parts Sale Type']);
  const partNumbers = splitByOperations(record['Part Number']);
  const partDescriptions = splitByOperations(record['Part Description']);
  const partQuantities = splitByOperations(record['Part Quantity']);
  const partsUnitCosts = splitByOperations(record['Parts Unit Cost']);
  const partsUnitSales = splitByOperations(record['Parts Unit Sale']);

  // Build a map of operation line numbers for quick lookup
  const opLineMap = new Map<number, ParsedOperation>();
  operations.forEach(op => {
    opLineMap.set(op.operationLineNumber, op);
  });

  // Parse each part entry
  partsLaborLineNumbers.forEach((lineNumStr, partGroupIndex) => {
    const operationLineNumber = parseInteger(lineNumStr);

    // Verify operation exists
    if (!opLineMap.has(operationLineNumber)) {
      errors.push({
        type: 'invalid_mapping',
        field: 'Parts Labor Line Number',
        message: `Part group ${partGroupIndex} maps to non-existent operation line ${operationLineNumber}`,
        context: { partGroupIndex, operationLineNumber },
      });
      return;
    }

    // Split parts within this group by ^
    const saleTypesForGroup = splitWithinOperation(partsSaleTypes[partGroupIndex] || '');
    const numbersForGroup = splitWithinOperation(partNumbers[partGroupIndex] || '');
    const descriptionsForGroup = splitWithinOperation(partDescriptions[partGroupIndex] || '');
    const quantitiesForGroup = splitWithinOperation(partQuantities[partGroupIndex] || '');
    const costsForGroup = splitWithinOperation(partsUnitCosts[partGroupIndex] || '');
    const salesForGroup = splitWithinOperation(partsUnitSales[partGroupIndex] || '');

    // Create entry for each part in the group
    numbersForGroup.forEach((partNum, partIndex) => {
      if (partNum && partNum.trim() !== '') {
        const quantity = parseNumeric(quantitiesForGroup[partIndex] || '1');
        const unitCost = parseMonetary(costsForGroup[partIndex] || '0');
        const unitSale = parseMonetary(salesForGroup[partIndex] || '0');

        partEntries.push({
          tenantId,
          roNumber,
          operationLineNumber,
          partLineNumber: parseInteger(partsLineNumbers[partGroupIndex] || String(partGroupIndex + 1)),
          partsLaborLineNumber: operationLineNumber,
          saleType: (saleTypesForGroup[partIndex] || '').trim(),
          partNumber: partNum.trim(),
          partDescription: (descriptionsForGroup[partIndex] || '').trim(),
          quantity,
          unitCost,
          unitSale,
          totalCost: quantity * unitCost,
          totalSale: quantity * unitSale,
        });
      }
    });
  });

  return partEntries;
}

/**
 * Validate parsed data for consistency
 */
function validateParsedData(
  data: ParsedROData,
  errors: ParserValidationError[],
  warnings: string[]
): void {
  // Check tenant ID is present everywhere
  if (!data.header.tenantId) {
    errors.push({
      type: 'missing_tenant',
      field: 'tenantId',
      message: 'Missing tenant ID in header',
    });
  }

  data.operations.forEach((op, idx) => {
    if (!op.tenantId) {
      errors.push({
        type: 'missing_tenant',
        field: `operations[${idx}].tenantId`,
        message: `Missing tenant ID in operation ${op.operationLineNumber}`,
      });
    }
  });

  // Verify all parts map to valid operations
  const validOpLines = new Set(data.operations.map(op => op.operationLineNumber));
  
  data.partEntries.forEach((part, idx) => {
    if (!validOpLines.has(part.operationLineNumber)) {
      errors.push({
        type: 'invalid_mapping',
        field: `partEntries[${idx}].operationLineNumber`,
        message: `Part ${part.partNumber} maps to non-existent operation line ${part.operationLineNumber}`,
        context: { partNumber: part.partNumber, operationLineNumber: part.operationLineNumber },
      });
    }

    if (!part.tenantId) {
      errors.push({
        type: 'missing_tenant',
        field: `partEntries[${idx}].tenantId`,
        message: `Missing tenant ID in part entry ${part.partNumber}`,
      });
    }
  });

  data.laborEntries.forEach((labor, idx) => {
    if (!validOpLines.has(labor.operationLineNumber)) {
      errors.push({
        type: 'invalid_mapping',
        field: `laborEntries[${idx}].operationLineNumber`,
        message: `Labor entry maps to non-existent operation line ${labor.operationLineNumber}`,
        context: { techNumber: labor.techNumber, operationLineNumber: labor.operationLineNumber },
      });
    }

    if (!labor.tenantId) {
      errors.push({
        type: 'missing_tenant',
        field: `laborEntries[${idx}].tenantId`,
        message: `Missing tenant ID in labor entry for tech ${labor.techNumber}`,
      });
    }
  });

  // Add warnings for empty collections
  if (data.operations.length === 0) {
    warnings.push('No operations found in RO');
  }

  if (data.partEntries.length === 0) {
    warnings.push('No parts found in RO');
  }

  if (data.laborEntries.length === 0) {
    warnings.push('No labor entries found in RO');
  }
}

/**
 * Main parser function - parse a single RO record
 */
export function parseRORecord(record: RawRORecord): ParserResult {
  const errors: ParserValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Step 1: Extract and validate tenant ID
    const tenantId = extractTenantId(record, errors);
    if (!tenantId) {
      return {
        success: false,
        errors,
        warnings: ['Skipped due to missing tenant ID'],
      };
    }

    // Step 2: Parse RO header
    const header = parseROHeader(record, tenantId);
    const roNumber = header.roNumber;

    if (!roNumber) {
      errors.push({
        type: 'empty_field',
        field: 'RO Number',
        message: 'Missing RO Number',
      });
      return { success: false, errors, warnings };
    }

    // Step 3: Parse operations
    const operations = parseOperations(record, tenantId, roNumber, errors);

    // Step 4: Parse labor entries
    const laborEntries = parseLaborEntries(record, tenantId, roNumber, operations, errors);

    // Step 5: Parse part entries with mapping
    const partEntries = parsePartEntries(record, tenantId, roNumber, operations, errors);

    // Step 6: Build parsed data structure
    const data: ParsedROData = {
      header,
      operations,
      laborEntries,
      partEntries,
    };

    // Step 7: Validate consistency
    validateParsedData(data, errors, warnings);

    // Determine success
    const success = errors.length === 0;

    return {
      success,
      data,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: 'invalid_mapping',
      field: 'unknown',
      message: `Unexpected error during parsing: ${error instanceof Error ? error.message : String(error)}`,
    });

    return {
      success: false,
      errors,
      warnings,
    };
  }
}

/**
 * Batch parser - parse multiple RO records
 */
export function parseROBatch(records: RawRORecord[]): BatchParserResult {
  const results: ParserResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalOperations = 0;
  let totalLaborEntries = 0;
  let totalPartEntries = 0;
  const tenantSet = new Set<string>();

  records.forEach(record => {
    const result = parseRORecord(record);
    results.push(result);

    if (result.success) {
      successCount++;
      if (result.data) {
        totalOperations += result.data.operations.length;
        totalLaborEntries += result.data.laborEntries.length;
        totalPartEntries += result.data.partEntries.length;
        tenantSet.add(result.data.header.tenantId);
      }
    } else {
      failureCount++;
    }
  });

  return {
    totalRecords: records.length,
    successCount,
    failureCount,
    results,
    summary: {
      totalOperations,
      totalLaborEntries,
      totalPartEntries,
      tenants: Array.from(tenantSet),
    },
  };
}

/**
 * Utility to log parser results
 */
export function logParserResult(result: ParserResult, recordIndex?: number): void {
  const prefix = recordIndex !== undefined ? `[Record ${recordIndex}]` : '';

  if (result.success) {
    console.log(`${prefix} ✓ Successfully parsed RO ${result.data?.header.roNumber}`);
    if (result.data) {
      console.log(`  - Tenant: ${result.data.header.tenantId}`);
      console.log(`  - Operations: ${result.data.operations.length}`);
      console.log(`  - Labor entries: ${result.data.laborEntries.length}`);
      console.log(`  - Part entries: ${result.data.partEntries.length}`);
    }
    if (result.warnings.length > 0) {
      console.warn(`  Warnings:`, result.warnings);
    }
  } else {
    console.error(`${prefix} ✗ Failed to parse record`);
    console.error(`  Errors:`, result.errors);
    if (result.warnings.length > 0) {
      console.warn(`  Warnings:`, result.warnings);
    }
  }
}

/**
 * Utility to log batch results
 */
export function logBatchResults(batchResult: BatchParserResult): void {
  console.log('\n========== BATCH PARSING RESULTS ==========');
  console.log(`Total records: ${batchResult.totalRecords}`);
  console.log(`✓ Success: ${batchResult.successCount}`);
  console.log(`✗ Failed: ${batchResult.failureCount}`);
  console.log(`\nSummary:`);
  console.log(`  - Total operations: ${batchResult.summary.totalOperations}`);
  console.log(`  - Total labor entries: ${batchResult.summary.totalLaborEntries}`);
  console.log(`  - Total part entries: ${batchResult.summary.totalPartEntries}`);
  console.log(`  - Unique tenants: ${batchResult.summary.tenants.join(', ')}`);
  console.log('==========================================\n');
}

