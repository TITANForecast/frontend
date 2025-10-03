/**
 * Type definitions for DMS Repair Order (RO) Parser
 * Multi-tenant aware types for parsing flattened RO data
 */

// Raw RO record from DMS (flattened with delimiters)
export interface RawRORecord {
  // Tenant/Dealer identifiers
  "File Type": string;
  "DV Dealer ID": string;
  "Vendor Dealer ID": string;
  "DMS Type": string;

  // RO Header info
  "RO Number": string;
  "Open Date": string;
  "Close Date": string;
  "Service Advisor Number": string;
  "Service Advisor Name": string;
  "RO Department": string;
  "RO Store": string;
  "Appointment Date": string;
  "Appointment Flag": string;
  "Appointment Number": string;
  "RO Status": string;
  "Tag Number": string;
  
  // Totals (with commas in strings)
  "Total Cost": string;
  "Total Sale": string;
  "Customer Total Cost": string;
  "Customer Total Sale": string;
  "Warranty Total Cost": string;
  "Warranty Total Sale": string;
  "Internal Total Cost": string;
  "Internal Total Sale": string;
  "Total Labor Cost": string;
  "Total Labor Sale": string;
  "Total Parts Cost": string;
  "Total Parts Sale": string;
  "Total Sublet Cost": string;
  "Total Sublet Sale": string;
  "Total Tax": string;

  // Operation level fields (| delimited)
  "Operation Codes": string;
  "Operation Code Descriptions": string;
  "Tech Labor Line": string;
  "Operation Line Number": string;
  "Operation Sale Types": string;
  "Operation Line Cost": string;
  "Operation Line Sale": string;
  "Labor Cost": string;
  "Labor Sale": string;
  "Labor Bill Hours": string;
  "Labor Bill Rate": string;
  "Sublet Cost": string;
  "Sublet Sale": string;
  "Upsell": string;
  "Labor Cause": string;
  "Labor Complaint": string;
  "Labor Correction": string;
  "Labor Comments": string;

  // Parts level fields (| for operations, ^ for multiple parts within operation)
  "Parts Cost": string;
  "Parts Sale": string;
  "Misc Cost": string;
  "Misc Sale": string;
  "Gas/Oil/Grease Cost": string;
  "Gas/Oil/Grease Sale": string;

  // Mapping fields (links parts/labor to operations)
  "Parts Labor Line Number": string; // | delimited
  "Parts Line Number": string; // | delimited
  "Parts Sale Type": string; // | delimited, ^ within
  "Part Number": string; // | delimited, ^ within
  "Part Description": string; // | delimited, ^ within
  "Part Quantity": string; // | delimited, ^ within
  "Parts Unit Cost": string; // | delimited, ^ within
  "Parts Unit Sale": string; // | delimited, ^ within

  // Tech/Labor fields (^ delimited within operations)
  "Tech Number": string; // | delimited, ^ within
  "Tech Name": string;
  "Labor Tech Hours": string; // | delimited, ^ within
  "Labor Tech Rate": string; // | delimited, ^ within

  // Vehicle info
  "VIN": string;
  "Year": string;
  "Make": string;
  "Model": string;
  "Model Number": string;
  "RO Mileage": string;
  "Mileage Out": string;
  "Description": string;
  "Transmission": string;
  "VIN Explosion Year": string;
  "VIN Explosion Make": string;
  "VIN Explosion Model": string;
  "VIN Explosion Trim": string;
  "VIN Explosion Fuel Type": string;
  "VIN Explosion Engine Size": string;

  // Customer info
  "Customer Number": string;
  "Full Name": string;
  "First Name": string;
  "Middle Name": string;
  "Last Name": string;
  "Suffix": string;
  "Address Line 1": string;
  "Address Line 2": string;
  "City": string;
  "State": string;
  "Zip Code": string;
  "County": string;
  "Home Phone": string;
  "Cell Phone": string;
  "Work Phone": string;
  "Work Phone Extension": string;
  "Email 1": string;
  "Email 2": string;
  "Email 3": string;
  "Birth Date": string;
  "Individual/Business Flag": string;
  "Customer Create Date": string;
  "Customer Last Activity Date": string;

  [key: string]: string; // Allow for additional fields
}

// Parsed structured output
export interface ParsedROHeader {
  tenantId: string; // DV Dealer ID or Vendor Dealer ID
  dvDealerId: string;
  vendorDealerId: string;
  dmsType: string;
  roNumber: string;
  openDate: string;
  closeDate: string;
  serviceAdvisorNumber: string;
  serviceAdvisorName: string;
  roDepartment: string;
  roStore: string;
  appointmentDate: string;
  appointmentFlag: string;
  appointmentNumber: string;
  roStatus: string;
  tagNumber: string;
  
  // Totals (parsed as numbers)
  totalCost: number;
  totalSale: number;
  customerTotalCost: number;
  customerTotalSale: number;
  warrantyTotalCost: number;
  warrantyTotalSale: number;
  internalTotalCost: number;
  internalTotalSale: number;
  totalLaborCost: number;
  totalLaborSale: number;
  totalPartsCost: number;
  totalPartsSale: number;
  totalSubletCost: number;
  totalSubletSale: number;
  totalTax: number;

  // Vehicle
  vehicle: VehicleInfo;

  // Customer
  customer: CustomerInfo;
}

export interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  modelNumber: string;
  roMileage: number;
  mileageOut: number;
  description: string;
  transmission: string;
  vinExplosionYear: string;
  vinExplosionMake: string;
  vinExplosionModel: string;
  vinExplosionTrim: string;
  vinExplosionFuelType: string;
  vinExplosionEngineSize: string;
}

export interface CustomerInfo {
  customerNumber: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  homePhone: string;
  cellPhone: string;
  workPhone: string;
  workPhoneExtension: string;
  email1: string;
  email2: string;
  email3: string;
  birthDate: string;
  individualBusinessFlag: string;
  customerCreateDate: string;
  customerLastActivityDate: string;
}

export interface ParsedOperation {
  tenantId: string;
  roNumber: string;
  operationLineNumber: number;
  operationCode: string;
  operationCodeDescription: string;
  saleType: string; // C=Customer, W=Warranty, I=Internal
  operationLineCost: number;
  operationLineSale: number;
  laborCost: number;
  laborSale: number;
  laborBillHours: number;
  laborBillRate: number;
  subletCost: number;
  subletSale: number;
  upsell: string;
  laborCause: string;
  laborComplaint: string;
  laborCorrection: string;
  laborComments: string;
  techLaborLine: number;
}

export interface ParsedLaborEntry {
  tenantId: string;
  roNumber: string;
  operationLineNumber: number;
  laborLineNumber: number;
  techNumber: string;
  techName: string;
  techHours: number;
  techRate: number;
}

export interface ParsedPartEntry {
  tenantId: string;
  roNumber: string;
  operationLineNumber: number;
  partLineNumber: number;
  partsLaborLineNumber: number;
  saleType: string; // C=Customer, W=Warranty, I=Internal
  partNumber: string;
  partDescription: string;
  quantity: number;
  unitCost: number;
  unitSale: number;
  totalCost: number;
  totalSale: number;
}

export interface ParsedROData {
  header: ParsedROHeader;
  operations: ParsedOperation[];
  laborEntries: ParsedLaborEntry[];
  partEntries: ParsedPartEntry[];
}

export interface ParserValidationError {
  type: 'missing_tenant' | 'invalid_mapping' | 'delimiter_mismatch' | 'invalid_numeric' | 'empty_field';
  field: string;
  message: string;
  context?: any;
}

export interface ParserResult {
  success: boolean;
  data?: ParsedROData;
  errors: ParserValidationError[];
  warnings: string[];
}

export interface BatchParserResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  results: ParserResult[];
  summary: {
    totalOperations: number;
    totalLaborEntries: number;
    totalPartEntries: number;
    tenants: string[];
  };
}

