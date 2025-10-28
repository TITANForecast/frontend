// Database types for administration

import { UserRole } from './auth';

export type DataSource = 'Certify-Staging' | 'DealerVault-Production';

export interface DealerApiConfig {
  id: string;
  dealerId: string;
  dataSource: DataSource;
  rooftopId: string;
  programId: string;
  fileTypeCodes: string[]; // Array of file types: "SV", "PTINV", etc.
  compareDateDefault: number; // Days to subtract from current date
  lastSuccess: Date | null;
  lastError: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealerApiConfigInput {
  dataSource: DataSource;
  rooftopId: string;
  programId: string;
  fileTypeCodes?: string[];
  compareDateDefault?: number;
  isActive?: boolean;
}

export interface ImportLog {
  id: string; // Serialized from BigInt
  dealerId: string; // Serialized from BigInt (references Python dealer table)
  importType: string;
  fileType: string | null;
  requestId: string | null;
  status: string;
  totalRecords: number | null;
  processedRecords: number | null;
  failedRecords: number | null;
  newRecords: number | null;
  updatedRecords: number | null;
  errorMessage: string | null;
  importStartTime: Date | null;
  importEndTime: Date | null;
  elapsedSeconds: number | null;
  createdAt: Date | null;
}

export interface UserDealer {
  userId: string;
  dealerId: string;
  createdAt: Date;
}

export interface DealerExtended {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  apiConfig?: DealerApiConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealerInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

export interface UserExtended {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  defaultDealerId: string;
  isActive: boolean;
  dealers: DealerExtended[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  defaultDealerId: string;
  isActive?: boolean;
  dealerIds?: string[];
}

export interface SyncStatus {
  dealerId: string;
  dealerName: string;
  lastSync: Date | null;
  lastSuccess: Date | null;
  lastError: string | null;
  status: 'success' | 'error' | 'pending' | 'never_run';
  isActive: boolean;
}

export interface AdminStats {
  totalDealers: number;
  activeDealers: number;
  totalUsers: number;
  activeUsers: number;
  lastSyncTimestamp: Date | null;
  syncErrors: number;
}

