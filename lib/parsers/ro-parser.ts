/**
 * DMS Repair Order (RO) Parser Utility
 * Handles multi-tenant RO data with | and ^ delimiters
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

function parseMonetary(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseNumeric(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseFloat(value.trim());
  return isNaN(num) ? 0 : num;
}

function parseInteger(value: string): number {
  if (!value || value.trim() === '') return 0;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? 0 : num;
}

function splitByOperations(value: string): string[] {
  if (!value) return [];
  return value.split('|').map(item => item.trim()).filter(item => item);
}

function splitByDelimiter(value: string, delimiter: string = '^'): string[] {
  if (!value) return [];
  return value.split(delimiter).map(item => item.trim()).filter(item => item);
}

function extractTenantId(record: RawRORecord): string {
  const dealerId = record['DV Dealer ID'] || record['Vendor Dealer ID'];
  if (!dealerId) {
    throw new Error('Tenant ID not found in record');
  }
  return dealerId.trim();
}

function parseROHeader(record: RawRORecord, tenantId: string): ParsedROHeader {
  const customerInfo: CustomerInfo = {
    customerId: record['Customer ID'] || '',
    name: record['Customer Name'] || '',
    phone: record['Customer Phone'] || '',
    email: record['Customer Email'] || '',
    address: record['Customer Address'] || '',
  };

  const vehicleInfo: VehicleInfo = {
    vin: record['VIN'] || '',
    year: record['Vehicle Year'] || '',
    make: record['Vehicle Make'] || '',
    model: record['Vehicle Model'] || '',
    mileage: parseInteger(record['Mileage'] || '0'),
  };

  return {
    tenantId,
    roNumber: record['RO Number'] || '',
    customerInfo,
    vehicleInfo,
    totalAmount: parseMonetary(record['Total Amount'] || '0'),
    laborAmount: parseMonetary(record['Labor Amount'] || '0'),
    partsAmount: parseMonetary(record['Parts Amount'] || '0'),
    taxAmount: parseMonetary(record['Tax Amount'] || '0'),
    createdAt: record['Created Date'] || new Date().toISOString(),
  };
}

function parseOperations(record: RawRORecord): ParsedOperation[] {
  const operationCodes = splitByOperations(record['Operation Codes'] || '');
  const operationDescriptions = splitByOperations(record['Operation Code Descriptions'] || '');
  const partsLaborLineNumbers = splitByOperations(record['Parts Labor Line Number'] || '');
  
  const operations: ParsedOperation[] = [];
  
  for (let i = 0; i < operationCodes.length; i++) {
    const operationCode = operationCodes[i] || '';
    const operationDescription = operationDescriptions[i] || '';
    
    if (!operationCode) continue;
    
    const operation: ParsedOperation = {
      operationCode,
      operationDescription,
      laborEntries: parseLaborEntries(record, i + 1),
      partEntries: parsePartEntries(record, i + 1),
      totalLaborHours: 0,
      totalLaborAmount: 0,
      totalPartsAmount: 0,
    };
    
    // Calculate totals
    operation.totalLaborHours = operation.laborEntries.reduce((sum, entry) => sum + entry.hours, 0);
    operation.totalLaborAmount = operation.laborEntries.reduce((sum, entry) => sum + entry.amount, 0);
    operation.totalPartsAmount = operation.partEntries.reduce((sum, entry) => sum + entry.totalSale, 0);
    
    operations.push(operation);
  }
  
  return operations;
}

function parseLaborEntries(record: RawRORecord, operationIndex: number): ParsedLaborEntry[] {
  const technicianIds = splitByOperations(record['Technician ID'] || '');
  const technicianNames = splitByOperations(record['Technician Name'] || '');
  const laborHours = splitByOperations(record['Labor Hours'] || '');
  const laborRates = splitByOperations(record['Labor Rate'] || '');
  
  const entries: ParsedLaborEntry[] = [];
  
  for (let i = 0; i < technicianIds.length; i++) {
    const technicianId = technicianIds[i] || '';
    const technicianName = technicianNames[i] || '';
    const hours = parseNumeric(laborHours[i] || '0');
    const rate = parseMonetary(laborRates[i] || '0');
    
    if (technicianId && hours > 0) {
      entries.push({
        technicianId,
        technicianName,
        hours,
        rate,
        amount: hours * rate,
      });
    }
  }
  
  return entries;
}

function parsePartEntries(record: RawRORecord, operationIndex: number): ParsedPartEntry[] {
  const partNumbers = splitByOperations(record['Part Number'] || '');
  const partDescriptions = splitByOperations(record['Part Description'] || '');
  const quantities = splitByOperations(record['Part Quantity'] || '');
  const unitCosts = splitByOperations(record['Parts Unit Cost'] || '');
  const unitSales = splitByOperations(record['Parts Unit Sale'] || '');
  
  const entries: ParsedPartEntry[] = [];
  
  for (let i = 0; i < partNumbers.length; i++) {
    const partNumber = partNumbers[i] || '';
    const description = partDescriptions[i] || '';
    const quantity = parseNumeric(quantities[i] || '0');
    const unitCost = parseMonetary(unitCosts[i] || '0');
    const unitSale = parseMonetary(unitSales[i] || '0');
    
    if (partNumber && quantity > 0) {
      entries.push({
        partNumber,
        description,
        quantity,
        unitCost,
        unitSale,
        totalCost: quantity * unitCost,
        totalSale: quantity * unitSale,
      });
    }
  }
  
  return entries;
}

function validateParsedData(data: ParsedROData): ParserValidationError[] {
  const errors: ParserValidationError[] = [];
  
  if (!data.header.tenantId) {
    errors.push({ field: 'tenantId', message: 'Tenant ID is required' });
  }
  
  if (!data.header.roNumber) {
    errors.push({ field: 'roNumber', message: 'RO Number is required' });
  }
  
  if (data.operations.length === 0) {
    errors.push({ field: 'operations', message: 'At least one operation is required' });
  }
  
  return errors;
}

export function parseRORecord(record: RawRORecord): ParserResult {
  const errors: ParserValidationError[] = [];
  const warnings: string[] = [];
  
  try {
    // Extract tenant ID
    const tenantId = extractTenantId(record);
    
    // Parse header
    const header = parseROHeader(record, tenantId);
    
    // Parse operations
    const operations = parseOperations(record);
    
    const parsedData: ParsedROData = {
      header,
      operations,
    };
    
    // Validate parsed data
    const validationErrors = validateParsedData(parsedData);
    errors.push(...validationErrors);
    
    if (errors.length === 0) {
      return {
        success: true,
        data: parsedData,
        errors: [],
        warnings,
      };
    } else {
      return {
        success: false,
        errors,
        warnings,
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'general',
        message: error instanceof Error ? error.message : 'Unknown parsing error',
      }],
      warnings,
    };
  }
}

export function parseROBatch(records: RawRORecord[]): BatchParserResult {
  const results: ParserResult[] = [];
  const allErrors: ParserValidationError[] = [];
  const allWarnings: string[] = [];
  
  for (const record of records) {
    const result = parseRORecord(record);
    results.push(result);
    
    if (!result.success) {
      allErrors.push(...result.errors);
    }
    
    allWarnings.push(...result.warnings);
  }
  
  const successfulRecords = results.filter(r => r.success).length;
  const failedRecords = results.length - successfulRecords;
  
  return {
    totalRecords: records.length,
    successfulRecords,
    failedRecords,
    results,
    errors: allErrors,
    warnings: allWarnings,
  };
}

export function logParserResult(result: ParserResult): void {
  console.log('\n📊 Parser Result:');
  console.log(`✅ Success: ${result.success}`);
  
  if (result.data) {
    console.log(`🏢 Tenant: ${result.data.header.tenantId}`);
    console.log(`🔧 RO: ${result.data.header.roNumber}`);
    console.log(`⚙️ Operations: ${result.data.operations.length}`);
  }
  
  if (result.errors.length > 0) {
    console.log(`❌ Errors: ${result.errors.length}`);
    result.errors.forEach(error => {
      console.log(`  - ${error.field}: ${error.message}`);
    });
  }
  
  if (result.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${result.warnings.length}`);
    result.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
}

export function logBatchResults(batch: BatchParserResult): void {
  console.log('\n📊 Batch Parser Results:');
  console.log(`📈 Total Records: ${batch.totalRecords}`);
  console.log(`✅ Successful: ${batch.successfulRecords}`);
  console.log(`❌ Failed: ${batch.failedRecords}`);
  console.log(`📊 Success Rate: ${((batch.successfulRecords / batch.totalRecords) * 100).toFixed(1)}%`);
  
  if (batch.errors.length > 0) {
    console.log(`\n❌ Errors (${batch.errors.length}):`);
    batch.errors.forEach(error => {
      console.log(`  - ${error.field}: ${error.message}`);
    });
  }
  
  if (batch.warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${batch.warnings.length}):`);
    batch.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }
}
