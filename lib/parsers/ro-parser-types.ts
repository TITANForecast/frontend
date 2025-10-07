export interface RawRORecord {
  [key: string]: string;
}

export interface ParsedROHeader {
  tenantId: string;
  roNumber: string;
  customerInfo: CustomerInfo;
  vehicleInfo: VehicleInfo;
  totalAmount: number;
  laborAmount: number;
  partsAmount: number;
  taxAmount: number;
  createdAt: string;
}

export interface ParsedOperation {
  operationCode: string;
  operationDescription: string;
  laborEntries: ParsedLaborEntry[];
  partEntries: ParsedPartEntry[];
  totalLaborHours: number;
  totalLaborAmount: number;
  totalPartsAmount: number;
}

export interface ParsedLaborEntry {
  technicianId: string;
  technicianName: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface ParsedPartEntry {
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  unitSale: number;
  totalCost: number;
  totalSale: number;
}

export interface ParsedROData {
  header: ParsedROHeader;
  operations: ParsedOperation[];
}

export interface ParserValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ParserResult {
  success: boolean;
  data?: ParsedROData;
  errors: ParserValidationError[];
  warnings: string[];
}

export interface BatchParserResult {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  results: ParserResult[];
  errors: ParserValidationError[];
  warnings: string[];
}

export interface VehicleInfo {
  vin: string;
  year: string;
  make: string;
  model: string;
  mileage: number;
}

export interface CustomerInfo {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}
